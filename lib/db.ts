import path from "node:path";
import mysql, { type Pool, type PoolConnection, type RowDataPacket } from "mysql2/promise";
import { createSeed } from "./seed";
import { hashPassword } from "./password";
import { columnSql, createTableSql, ORDER_BY, SETTINGS_TABLE_SQL, TABLES, type ColKind } from "./schema";
import { BUILT_IN_ROLES, OWNER_ROLE_ID } from "./permissions";
import type { Collection, Database, Settings } from "./types";

/**
 * MySQL data layer.
 *
 * Callers work with a plain `Database` object: `getDb()` loads it and
 * `mutate(fn)` lets `fn` change it, then writes only the rows that actually
 * changed (INSERT … ON DUPLICATE KEY UPDATE / DELETE) in one transaction.
 * Tables and seed data are created automatically on first connection.
 */

/** Uploaded media still lives on disk (see app/uploads). */
export const DATA_DIR = path.join(process.cwd(), "data");

const COLLECTIONS = Object.keys(TABLES) as Collection[];

function config() {
  if (process.env.DATABASE_URL) return { uri: process.env.DATABASE_URL };
  return {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "tiles",
  };
}

const g = globalThis as unknown as { __tilesPool?: Pool; __tilesReady?: Promise<void> };

function pool() {
  g.__tilesPool ??= mysql.createPool({
    ...config(),
    connectionLimit: 10,
    timezone: "Z",
    charset: "utf8mb4",
  });
  return g.__tilesPool;
}

async function ensureSchema() {
  const cfg = config();
  if (!("uri" in cfg)) {
    // create the database itself if it does not exist yet (XAMPP friendly)
    const { database, ...server } = cfg;
    const conn = await mysql.createConnection(server);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.end();
  }
  const db = pool();
  await db.query(SETTINGS_TABLE_SQL);
  for (const t of COLLECTIONS) await db.query(createTableSql(t));
  await migrate(db);

  const [rows] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM `users`");
  if (Number(rows[0].n) === 0) {
    const email = process.env.ADMIN_EMAIL || "admin@tilora.com";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const seed = createSeed(hashPassword(password), email);
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await saveSettings(conn, seed.settings);
      for (const t of COLLECTIONS) await upsert(conn, t, seed[t] as unknown as Record<string, unknown>[]);
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }
}

/** Add columns introduced after a table was first created, and backfill data. */
async function migrate(db: Pool) {
  for (const t of COLLECTIONS) {
    const [cols] = await db.query<RowDataPacket[]>(`SHOW COLUMNS FROM \`${t}\``);
    const have = new Set(cols.map((c) => String(c.Field)));
    for (const [name, kind] of Object.entries(TABLES[t])) {
      if (!have.has(name)) await db.query(`ALTER TABLE \`${t}\` ADD COLUMN ${columnSql(name, kind)}`);
    }
    // users v1 stored a plain "admin" / "editor" role
    if (t === "users" && have.has("role")) {
      await db.query("UPDATE `users` SET `roleId` = IF(`role` = 'admin', ?, 'role-editor') WHERE `roleId` = ''", [OWNER_ROLE_ID]);
      await db.query("UPDATE `users` SET `status` = 'active' WHERE `status` = ''");
    }
  }
  // built-in roles: insert missing ones only, never overwrite edits
  const now = new Date();
  for (const r of BUILT_IN_ROLES) {
    await db.query(
      "INSERT IGNORE INTO `roles` (`id`, `name`, `description`, `color`, `permissions`, `system`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [r.id, r.name, r.description, r.color, JSON.stringify(r.permissions), r.system ? 1 : 0, now, now],
    );
  }
}

function ready() {
  g.__tilesReady ??= ensureSchema().catch((e) => {
    g.__tilesReady = undefined; // retry on next request
    throw new Error(`MySQL connection failed — is MySQL running and are the MYSQL_* env vars correct? (${(e as Error).message})`);
  });
  return g.__tilesReady;
}

/* ------------------------------------------------------- value mapping */

function fromSql(kind: ColKind, v: unknown): unknown {
  switch (kind) {
    case "bool":
      return Boolean(v);
    case "int":
    case "float":
      return Number(v ?? 0);
    case "json":
      try {
        return v ? JSON.parse(String(v)) : [];
      } catch {
        return [];
      }
    case "datetime":
      return v instanceof Date ? v.toISOString() : v ? String(v) : "";
    default:
      return v ?? "";
  }
}

function toSql(kind: ColKind, v: unknown): unknown {
  switch (kind) {
    case "bool":
      return v ? 1 : 0;
    case "int":
      return Math.round(Number(v) || 0);
    case "float":
      return Number(v) || 0;
    case "json":
      return JSON.stringify(v ?? []);
    case "datetime": {
      if (!v) return null;
      const d = new Date(String(v));
      return Number.isNaN(d.getTime()) ? null : d;
    }
    default:
      return v ?? "";
  }
}

/* --------------------------------------------------------------- reads */

async function load(conn: Pool | PoolConnection): Promise<Database> {
  const [settingsRows] = await conn.query<RowDataPacket[]>("SELECT `value` FROM `settings` WHERE `key` = 'site'");
  const out = { settings: settingsRows[0] ? (JSON.parse(settingsRows[0].value) as Settings) : ({} as Settings) } as Database;
  await Promise.all(
    COLLECTIONS.map(async (t) => {
      const cols = TABLES[t];
      const [rows] = await conn.query<RowDataPacket[]>(`SELECT * FROM \`${t}\`${ORDER_BY[t] ? ` ORDER BY ${ORDER_BY[t]}` : ""}`);
      (out as unknown as Record<string, unknown[]>)[t] = rows.map((r) =>
        Object.fromEntries(Object.entries(cols).map(([name, kind]) => [name, fromSql(kind, r[name])])),
      );
    }),
  );
  return out;
}

export async function getDb(): Promise<Database> {
  await ready();
  return load(pool());
}

/* -------------------------------------------------------------- writes */

async function saveSettings(conn: PoolConnection, settings: Settings) {
  await conn.query("INSERT INTO `settings` (`key`, `value`) VALUES ('site', ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)", [
    JSON.stringify(settings),
  ]);
}

async function upsert(conn: PoolConnection, table: Collection, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const cols = Object.entries(TABLES[table]);
  const names = cols.map(([n]) => `\`${n}\``).join(", ");
  const updates = cols.filter(([n]) => n !== "id").map(([n]) => `\`${n}\` = VALUES(\`${n}\`)`).join(", ");
  const values = rows.map((r) => cols.map(([n, kind]) => toSql(kind, r[n])));
  await conn.query(`INSERT INTO \`${table}\` (${names}) VALUES ? ON DUPLICATE KEY UPDATE ${updates}`, [values]);
}

let queue: Promise<unknown> = Promise.resolve();

/** Run a mutation against the latest data and persist only what changed. */
export function mutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    await ready();
    const conn = await pool().getConnection();
    try {
      await conn.beginTransaction();
      const db = await load(conn);
      const before = new Map<string, string>();
      for (const t of COLLECTIONS) for (const r of db[t] as { id: string }[]) before.set(`${t}:${r.id}`, JSON.stringify(r));
      const settingsBefore = JSON.stringify(db.settings);

      const result = await fn(db);

      if (JSON.stringify(db.settings) !== settingsBefore) await saveSettings(conn, db.settings);
      for (const t of COLLECTIONS) {
        const rows = db[t] as unknown as (Record<string, unknown> & { id: string })[];
        const ids = new Set(rows.map((r) => r.id));
        const changed = rows.filter((r) => before.get(`${t}:${r.id}`) !== JSON.stringify(r));
        const removed = [...before.keys()].filter((k) => k.startsWith(`${t}:`)).map((k) => k.slice(t.length + 1)).filter((id) => !ids.has(id));
        if (removed.length) await conn.query(`DELETE FROM \`${t}\` WHERE \`id\` IN (?)`, [removed]);
        await upsert(conn, t, changed);
      }
      // keep the activity log bounded
      await conn.query("DELETE FROM `activity` WHERE `id` NOT IN (SELECT `id` FROM (SELECT `id` FROM `activity` ORDER BY `at` DESC LIMIT 200) AS keep)");

      await conn.commit();
      return result;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  });
  queue = run.catch(() => undefined);
  return run;
}

/** Hot path for the product-page view counter — a single atomic UPDATE. */
export async function incrementProductViews(id: string) {
  await ready();
  await pool().query("UPDATE `products` SET `views` = `views` + 1 WHERE `id` = ?", [id]);
}

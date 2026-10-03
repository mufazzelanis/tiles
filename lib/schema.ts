import type { Collection } from "./types";

/**
 * MySQL table definitions. Each collection in `Database` maps to one table;
 * column names match the TypeScript field names exactly.
 */
export type ColKind = "id" | "string" | "text" | "int" | "float" | "bool" | "json" | "datetime";

const ts = { createdAt: "datetime", updatedAt: "datetime" } as const;

export const TABLES: Record<Collection, Record<string, ColKind>> = {
  roles: { id: "id", name: "string", description: "text", color: "string", permissions: "json", system: "bool", ...ts },
  users: {
    id: "id", name: "string", email: "string", phone: "string", passwordHash: "string", roleId: "string", status: "string",
    sessionVersion: "int", mustChangePassword: "bool", failedAttempts: "int", lockedUntil: "datetime", loginCount: "int",
    lastLoginAt: "datetime", createdBy: "string", ...ts,
  },
  categories: { id: "id", name: "string", slug: "string", image: "text", description: "text", order: "int", active: "bool", ...ts },
  products: {
    id: "id", name: "string", slug: "string", code: "string", categoryId: "string", size: "string", finish: "string",
    color: "string", thickness: "string", applications: "json", piecesPerBox: "int", sqftPerBox: "float", price: "float",
    images: "json", description: "text", featured: "bool", isNew: "bool", active: "bool", views: "int", ...ts,
  },
  slides: { id: "id", title: "string", subtitle: "string", image: "text", ctaLabel: "string", ctaLink: "string", order: "int", active: "bool", ...ts },
  stores: { id: "id", name: "string", type: "string", division: "string", address: "text", phone: "string", mapUrl: "text", active: "bool", ...ts },
  news: { id: "id", title: "string", slug: "string", type: "string", image: "text", excerpt: "text", content: "text", publishedAt: "datetime", active: "bool", ...ts },
  projects: { id: "id", title: "string", slug: "string", client: "string", location: "string", year: "int", image: "text", description: "text", active: "bool", ...ts },
  catalogues: { id: "id", title: "string", cover: "text", fileUrl: "text", year: "int", active: "bool", ...ts },
  sustainability: { id: "id", title: "string", heading: "string", body: "text", image: "text", order: "int", active: "bool", ...ts },
  inquiries: {
    id: "id", name: "string", email: "string", phone: "string", subject: "string", message: "text", productId: "string",
    status: "string", notes: "text", ...ts,
  },
  activity: { id: "id", userName: "string", action: "string", target: "text", at: "datetime" },
};

/** Order rows are returned in when loaded (newest first where it matters). */
export const ORDER_BY: Partial<Record<Collection, string>> = {
  inquiries: "`createdAt` DESC",
  activity: "`at` DESC",
  products: "`createdAt` DESC",
};

const INDEXES: Partial<Record<Collection, string[]>> = {
  users: ["UNIQUE KEY `uq_users_email` (`email`)"],
  products: ["UNIQUE KEY `uq_products_slug` (`slug`)", "KEY `ix_products_category` (`categoryId`)"],
  categories: ["UNIQUE KEY `uq_categories_slug` (`slug`)"],
  news: ["UNIQUE KEY `uq_news_slug` (`slug`)"],
  inquiries: ["KEY `ix_inquiries_status` (`status`)", "KEY `ix_inquiries_created` (`createdAt`)"],
  activity: ["KEY `ix_activity_at` (`at`)"],
};

const SQL_TYPE: Record<ColKind, string> = {
  id: "VARCHAR(40) NOT NULL",
  string: "VARCHAR(255) NOT NULL DEFAULT ''",
  text: "TEXT NULL",
  int: "INT NOT NULL DEFAULT 0",
  float: "DOUBLE NOT NULL DEFAULT 0",
  bool: "TINYINT(1) NOT NULL DEFAULT 0",
  json: "LONGTEXT NULL",
  datetime: "DATETIME(3) NULL",
};

export function columnSql(name: string, kind: ColKind) {
  return `\`${name}\` ${SQL_TYPE[kind]}`;
}

export function createTableSql(table: Collection) {
  const cols = Object.entries(TABLES[table]).map(([name, kind]) => `  ${columnSql(name, kind)}`);
  const keys = ["  PRIMARY KEY (`id`)", ...(INDEXES[table] ?? []).map((k) => `  ${k}`)];
  return `CREATE TABLE IF NOT EXISTS \`${table}\` (\n${[...cols, ...keys].join(",\n")}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
}

export const SETTINGS_TABLE_SQL =
  "CREATE TABLE IF NOT EXISTS `settings` (\n  `key` VARCHAR(64) NOT NULL,\n  `value` LONGTEXT NOT NULL,\n  PRIMARY KEY (`key`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

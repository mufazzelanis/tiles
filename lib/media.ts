import { promises as fs } from "node:fs";
import path from "node:path";
import { DATA_DIR } from "./db";

export interface MediaFile {
  name: string;
  url: string;
  size: number;
  modified: string;
  kind: "image" | "pdf";
}

/** Files uploaded through the admin, newest first. */
export async function listMedia(): Promise<MediaFile[]> {
  const dir = path.join(DATA_DIR, "uploads");
  const names = await fs.readdir(dir).catch(() => [] as string[]);
  const files = await Promise.all(
    names.map(async (name) => {
      const stat = await fs.stat(path.join(dir, name));
      return {
        name,
        url: `/uploads/${name}`,
        size: stat.size,
        modified: stat.mtime.toISOString(),
        kind: name.endsWith(".pdf") ? ("pdf" as const) : ("image" as const),
      };
    }),
  );
  return files.sort((a, b) => b.modified.localeCompare(a.modified));
}

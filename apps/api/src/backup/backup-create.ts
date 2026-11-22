import Database from "better-sqlite3";
import { type Database as SqliteDatabase } from "better-sqlite3";
import { createHash } from "node:crypto";
import { lstat, mkdir, readdir, readFile, rename, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { config, product } from "../config.js";
import { db } from "../db/pool.js";
import { isValidKey, pathFor } from "../lib/files.js";
import { APP_VERSION } from "../version.js";
import type { BackupKind, BackupMeta, BackupInfo } from "./backup-shared.js";
import { META_TABLE, FILES_TABLE, PREFIX, NAME, backupDir, stamp, kindOf } from "./backup-shared.js";

/** Taking a backup and listing the ones that exist. */

// ── taking one ───────────────────────────────────────────────────────────────

/**
 * Takes a backup of the database and every evidence document it refers to.
 *
 * The database copy uses SQLite's online backup, so people can keep working.
 * Documents are read after it, so one uploaded in between is simply not in
 * this backup; one deleted in between is counted as missing, and said so.
 */
export async function createBackup(kind: Exclude<BackupKind, "pre-update" | "uploaded">): Promise<BackupInfo> {
  const dir = backupDir();
  await mkdir(dir, { recursive: true });
  const name = `${PREFIX[kind]}-${stamp()}.db`;
  const partial = join(dir, `.${name}.partial`);

  await rm(partial, { force: true });
  await db.backup(partial);

  const out = new Database(partial);
  let files = 0;
  let missing = 0;
  try {
    out.exec(`
      create table ${META_TABLE} (id integer primary key check (id = 1), json text not null);
      create table ${FILES_TABLE} (key text primary key, sha256 text not null, size integer not null, data blob not null);
    `);
    const keys = out
      .prepare("select distinct file_key as key from evidence where file_key is not null union select file_key from attachments")
      .all() as { key: string }[];
    const insert = out.prepare(`insert into ${FILES_TABLE} (key, sha256, size, data) values (?, ?, ?, ?)`);

    for (const { key } of keys) {
      if (!isValidKey(key)) continue;
      let data: Buffer;
      try {
        data = await readFile(pathFor(key));
      } catch {
        missing++;
        continue;
      }
      insert.run(key, createHash("sha256").update(data).digest("hex"), data.length, data);
      files++;
    }

    const meta: BackupMeta = {
      format: 1,
      product: config.PRODUCT,
      productName: product.name,
      version: APP_VERSION,
      createdAt: new Date().toISOString(),
      kind,
      evidenceFiles: files,
      evidenceMissing: missing,
    };
    out.prepare(`insert into ${META_TABLE} (id, json) values (1, ?)`).run(JSON.stringify(meta));
    // A backup is read far more rarely than it is kept; make it small.
    out.pragma("journal_mode = DELETE");
    out.exec("VACUUM");
  } finally {
    out.close();
  }

  const final = join(dir, name);
  await rename(partial, final);
  return describe(name);
}

// ── listing ──────────────────────────────────────────────────────────────────

export function readMeta(file: SqliteDatabase): BackupMeta | null {
  const has = file.prepare("select 1 from sqlite_master where type = 'table' and name = ?").get(META_TABLE);
  if (!has) return null;
  try {
    const row = file.prepare(`select json from ${META_TABLE} where id = 1`).get() as { json: string } | undefined;
    return row ? (JSON.parse(row.json) as BackupMeta) : null;
  } catch {
    return null;
  }
}

export async function describe(name: string): Promise<BackupInfo> {
  const path = join(backupDir(), name);
  const info = await stat(path);
  let meta: BackupMeta | null = null;
  try {
    const file = new Database(path, { readonly: true, fileMustExist: true });
    try {
      meta = readMeta(file);
    } finally {
      file.close();
    }
  } catch {
    /* unreadable: listed, and refused if anyone tries to restore it */
  }
  return {
    name,
    kind: kindOf(name),
    size: info.size,
    createdAt: meta?.createdAt ?? info.mtime.toISOString(),
    includesEvidence: Boolean(meta),
    evidenceFiles: meta?.evidenceFiles ?? 0,
    version: meta?.version ?? null,
  };
}

export async function listBackups(): Promise<BackupInfo[]> {
  const dir = backupDir();
  const names = await readdir(dir).catch(() => [] as string[]);
  const out: BackupInfo[] = [];
  for (const name of names.filter((n) => NAME.test(n))) {
    const info = await lstat(join(dir, name)).catch(() => null);
    if (info?.isFile()) out.push(await describe(name));
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

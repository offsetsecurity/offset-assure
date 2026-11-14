import Database from "better-sqlite3";
import { type Database as SqliteDatabase } from "better-sqlite3";
import { createHash } from "node:crypto";
import { mkdir, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config, product } from "../config.js";
import { databasePath, db } from "../db/pool.js";
import { migrate } from "../db/migrate.js";
import { evidenceDir, isValidKey, pathFor } from "../lib/files.js";
import type { BackupMeta } from "./backup-shared.js";
import { META_TABLE, FILES_TABLE, NAME, refuse, backupDir, stamp, backupPath } from "./backup-shared.js";
import { createBackup, readMeta } from "./backup-create.js";
import { pruneBackups } from "./backup-retention.js";

/** Checking a backup, recovering files from backups, and restoring one. */

// ── checking one ─────────────────────────────────────────────────────────────

export const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");

/**
 * Everything that must be true of a file before it may replace the data.
 *
 * Returns the reason in words when it is not. Checked again at the moment of
 * restoring, not only when a file is uploaded, because the folder can change
 * in between.
 */
/**
 * Puts back documents the database refers to but the evidence folder lacks,
 * from the newest backup that holds each one.
 *
 * Until 0.2.47 the Docker image never set EVIDENCE_DIR, so uploads went into
 * the container rather than the evidence volume, and every update, which
 * recreates the container, lost them. Nightly and manual backups did copy
 * them, and that is where they come back from. Run at start-up; harmless
 * when nothing is missing, which is every other time.
 */
export async function recoverMissingFiles(): Promise<{ missing: number; recovered: number }> {
  const referenced = db
    .prepare("select distinct file_key as key from evidence where file_key is not null union select file_key from attachments")
    .all() as { key: string }[];
  const wanted = new Set<string>();
  for (const { key } of referenced) {
    if (!isValidKey(key)) continue;
    const info = await stat(pathFor(key)).catch(() => null);
    if (!info?.isFile()) wanted.add(key);
  }
  const missing = wanted.size;
  if (missing === 0) return { missing, recovered: 0 };

  // Newest first: the names carry the time they were taken.
  const dated = async (name: string) => ({ name, at: (await stat(join(backupDir(), name)).catch(() => null))?.mtimeMs ?? 0 });
  const names = (await readdir(backupDir()).catch(() => [] as string[])).filter((n) => NAME.test(n));
  const newestFirst = (await Promise.all(names.map(dated))).sort((a, b) => b.at - a.at);

  let recovered = 0;
  for (const { name } of newestFirst) {
    if (wanted.size === 0) break;
    let file: SqliteDatabase | undefined;
    try {
      file = new Database(join(backupDir(), name), { readonly: true, fileMustExist: true });
      if (!file.prepare("select 1 from sqlite_master where type = 'table' and name = ?").get(FILES_TABLE)) continue;
      const read = file.prepare(`select sha256, data from ${FILES_TABLE} where key = ?`);
      for (const key of [...wanted]) {
        const row = read.get(key) as { sha256: string; data: Buffer } | undefined;
        if (!row || createHash("sha256").update(row.data).digest("hex") !== row.sha256) continue;
        const path = pathFor(key);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(`${path}.restoring`, row.data);
        await rename(`${path}.restoring`, path);
        wanted.delete(key);
        recovered++;
      }
    } catch {
      // An unreadable backup is skipped, not fatal: the next one may have it.
    } finally {
      file?.close();
    }
  }
  return { missing, recovered };
}

export async function inspectBackup(path: string): Promise<BackupMeta | null> {
  let file: SqliteDatabase | undefined;
  try {
    file = new Database(path, { readonly: true, fileMustExist: true });
    file.prepare("select count(*) from sqlite_master").get();
  } catch {
    // Closed before refusing. SQLite opens a file that is not a database
    // without complaint and only fails at the first read, and a handle left
    // open is one Windows will not let the upload be deleted through.
    try {
      file?.close();
    } catch {
      /* never opened */
    }
    return refuse("That file is not an Offset backup.");
  }

  try {
    const check = file.pragma("quick_check", { simple: true });
    if (check !== "ok") refuse("That backup is damaged, so it has not been used.");

    const tables = new Set(
      (file.prepare("select name from sqlite_master where type = 'table'").all() as { name: string }[]).map((t) => t.name),
    );
    for (const t of ["users", "controls", "evidence", "settings", "schema_migrations"]) {
      if (!tables.has(t)) refuse("That file is not an Offset backup.");
    }

    // A backup made by a newer version has tables this version does not
    // understand, and a migration history it cannot continue.
    const known = new Set((await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")));
    const applied = (file.prepare("select name from schema_migrations").all() as { name: string }[]).map((r) => r.name);
    if (applied.some((n) => !known.has(n))) {
      refuse("That backup was made by a newer version of Offset. Update this server first, then restore it.");
    }

    // The right product. A backup from another framework would put the wrong
    // controls under this product's name.
    const meta = readMeta(file);
    if (meta && meta.product !== config.PRODUCT) {
      refuse(`That backup is from ${meta.productName}, not ${product.name}.`);
    }
    if (!meta) {
      const theirs = (file.prepare("select ref from controls").all() as { ref: string }[]).map((r) => r.ref);
      const ours = new Set((db.prepare("select ref from controls").all() as { ref: string }[]).map((r) => r.ref));
      const matching = theirs.filter((r) => ours.has(r)).length;
      if (theirs.length === 0 || matching / theirs.length < 0.9) {
        refuse(`That backup is not from ${product.name}.`);
      }
    }

    // Somebody must be able to sign in afterwards, or the restore locks
    // everyone out of their own system.
    const admins = file
      .prepare("select count(*) as n from users where role = 'admin' and disabled = 0")
      .get() as { n: number };
    if (!admins.n) refuse("Nobody could sign in as an administrator after restoring that backup, so it has not been used.");

    if (tables.has(FILES_TABLE)) {
      const rows = file.prepare(`select key, sha256, data from ${FILES_TABLE}`).iterate() as Iterable<{
        key: string; sha256: string; data: Buffer;
      }>;
      for (const row of rows) {
        if (!isValidKey(row.key) || createHash("sha256").update(row.data).digest("hex") !== row.sha256) {
          refuse("An evidence document inside that backup is damaged, so it has not been used.");
        }
      }
    }
    return meta;
  } finally {
    file.close();
  }
}

// ── restoring ────────────────────────────────────────────────────────────────

export let restoring = false;

/** True while a restore is swapping the data. The application answers nothing else meanwhile. */
export const restoreInProgress = (): boolean => restoring;

export interface RestoreResult {
  restored: string;
  safetyBackup: string;
  evidenceFiles: number;
}

/**
 * Replaces the data with a backup.
 *
 *  1. Check the file (inspectBackup). Nothing changes if it fails.
 *  2. Back up the present, so this can be undone by restoring that.
 *  3. Stop answering requests, so nothing is written halfway through.
 *  4. Copy the backup's database over the live one with SQLite's backup API,
 *     from a copy with the documents taken out, then bring its schema up to
 *     date - an older backup is restored and then migrated forward.
 *  5. Put the documents back, and remove any the restored database no longer
 *     refers to.
 *  6. End every session: accounts are now as they were in the backup.
 */
export async function restoreBackup(name: string): Promise<RestoreResult> {
  if (restoring) refuse("A restore is already in progress.");
  const source = await backupPath(name);
  await inspectBackup(source);

  const safety = await createBackup("pre-restore");

  restoring = true;
  const dir = backupDir();
  const working = join(dir, `.restore-${stamp()}.db`);
  try {
    // A private copy to take the documents out of, so the live database never
    // holds them.
    const original = new Database(source, { readonly: true, fileMustExist: true });
    try {
      await original.backup(working);
    } finally {
      original.close();
    }

    const copy = new Database(working);
    const documents: { key: string; data: Buffer }[] = [];
    try {
      const hasFiles = copy.prepare("select 1 from sqlite_master where type = 'table' and name = ?").get(FILES_TABLE);
      if (hasFiles) {
        for (const row of copy.prepare(`select key, sha256, data from ${FILES_TABLE}`).iterate() as Iterable<{
          key: string; sha256: string; data: Buffer;
        }>) {
          if (isValidKey(row.key) && createHash("sha256").update(row.data).digest("hex") === row.sha256) {
            documents.push({ key: row.key, data: Buffer.from(row.data) });
          }
        }
      }
      copy.exec(`drop table if exists ${FILES_TABLE}; drop table if exists ${META_TABLE};`);
      copy.pragma("journal_mode = DELETE");
      copy.exec("VACUUM");
    } finally {
      copy.close();
    }

    // The swap. The backup API writes into the live file through SQLite's own
    // locking, so the worker, which has the same file open, sees the new data
    // rather than a file changed underneath it.
    const stripped = new Database(working, { readonly: true, fileMustExist: true });
    try {
      await stripped.backup(databasePath);
    } finally {
      stripped.close();
    }
    await migrate();

    // Documents: write each one, then remove those nothing refers to any more.
    // Anything removed is in the safety backup taken above.
    for (const doc of documents) {
      const path = pathFor(doc.key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(`${path}.restoring`, doc.data);
      await rename(`${path}.restoring`, path);
    }
    const referenced = new Set(
      (db.prepare("select file_key from evidence where file_key is not null union select file_key from attachments").all() as { file_key: string }[])
        .map((r) => r.file_key),
    );
    for (const shard of await readdir(evidenceDir()).catch(() => [] as string[])) {
      if (!/^[0-9a-f]{2}$/.test(shard)) continue;
      for (const key of await readdir(join(evidenceDir(), shard)).catch(() => [] as string[])) {
        if (isValidKey(key) && !referenced.has(key)) await rm(join(evidenceDir(), shard, key), { force: true });
      }
    }

    db.prepare("delete from sessions").run();
    // The safety copy is what undoes this restore, so it stays whatever the
    // limit says; so does the backup just restored, until the next one is taken.
    await pruneBackups([safety.name, name]);
    return { restored: name, safetyBackup: safety.name, evidenceFiles: documents.length };
  } finally {
    await rm(working, { force: true }).catch(() => undefined);
    restoring = false;
  }
}

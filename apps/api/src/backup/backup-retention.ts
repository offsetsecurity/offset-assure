import { lstat, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { config } from "../config.js";
import { NAME, backupDir } from "./backup-shared.js";

/** Keeping only the newest backups of each kind. */

// ── keeping only the newest ──────────────────────────────────────────────────

/**
 * Deletes all but the newest BACKUP_KEEP backups, of every kind, and returns
 * the names it removed.
 *
 * Every kind counts, not only the nightly ones, so the folder never holds more
 * than the setting says: a backup taken by hand or before an update is a full
 * copy too, and would otherwise sit there until somebody remembered it.
 *
 * Newest by when the file arrived in the folder, not by the date recorded
 * inside it, so a backup uploaded to be restored counts as new even when it
 * was taken months ago. Names in `protect` are never deleted: the one just
 * taken, and the ones a restore is using.
 */
export async function pruneBackups(protect: readonly string[] = []): Promise<string[]> {
  const dir = backupDir();
  const names = (await readdir(dir).catch(() => [] as string[])).filter((n) => NAME.test(n));
  const dated: { name: string; at: number }[] = [];
  for (const name of names) {
    const info = await lstat(join(dir, name)).catch(() => null);
    if (info?.isFile()) dated.push({ name, at: info.mtimeMs });
  }
  dated.sort((a, b) => b.at - a.at || b.name.localeCompare(a.name));
  const stale = dated
    .slice(config.BACKUP_KEEP)
    .map((d) => d.name)
    .filter((name) => !protect.includes(name));
  for (const name of stale) {
    // SQLite leaves -wal and -shm files beside a copy it has opened to read;
    // they go with it.
    for (const suffix of ["", "-wal", "-shm"]) {
      await rm(join(dir, name + suffix), { force: true }).catch(() => {
        /* in use: it goes next time */
      });
    }
  }
  return stale;
}

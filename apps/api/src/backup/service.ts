import { rename, rm } from "node:fs/promises";
import { join } from "node:path";
import type { BackupInfo } from "./backup-shared.js";
import { backupDir, stamp, backupPath } from "./backup-shared.js";
import { describe } from "./backup-create.js";
import { inspectBackup } from "./backup-restore.js";
export type { BackupKind } from "./backup-shared.js";
export type { BackupMeta } from "./backup-shared.js";
export type { BackupInfo } from "./backup-shared.js";
export { BackupError } from "./backup-shared.js";
export { backupDir } from "./backup-shared.js";
export { backupPath } from "./backup-shared.js";
export { recoverMissingFiles } from "./backup-restore.js";
export { inspectBackup } from "./backup-restore.js";
export { restoreInProgress } from "./backup-restore.js";
export type { RestoreResult } from "./backup-restore.js";
export { restoreBackup } from "./backup-restore.js";
export { createBackup } from "./backup-create.js";
export { listBackups } from "./backup-create.js";
export { pruneBackups } from "./backup-retention.js";

/**
 * Backups people can take, keep, download and restore from the screen.
 *
 * A backup is one SQLite file: an online copy of the database, with every
 * evidence document the database points at stored inside it, each under its
 * SHA-256. One file because a backup that is two things - a database here, a
 * folder of documents there - gets half-copied, and a database restored
 * without its documents is a register of evidence that is no longer there.
 * SQLite because it is already the format, it checks itself, and any SQLite
 * tool can open it.
 *
 * Restoring is the most destructive thing the product can do, so it checks
 * the file before touching anything, takes a backup of the present first, and
 * stops the application answering while it swaps. See restoreBackup.
 */

// ── uploads and deletion ─────────────────────────────────────────────────────

/** Accepts a file that has been written to `partial`, if it is a backup this server can restore. */
export async function acceptUpload(partial: string): Promise<BackupInfo> {
  try {
    await inspectBackup(partial);
  } catch (err) {
    await rm(partial, { force: true });
    throw err;
  }
  const name = `uploaded-${stamp()}.db`;
  await rename(partial, join(backupDir(), name));
  return describe(name);
}

export async function deleteBackup(name: string): Promise<void> {
  await rm(await backupPath(name), { force: true });
}


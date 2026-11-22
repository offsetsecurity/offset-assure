import { lstat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config } from "../config.js";

/** What every part of the backup service shares: the table names, the shapes, the error, where backups are kept and how one is named and found. */

export const META_TABLE = "offset_backup_meta";
export const FILES_TABLE = "offset_backup_files";

export type BackupKind = "nightly" | "manual" | "pre-restore" | "pre-update" | "uploaded";

export const PREFIX: Record<BackupKind, string> = {
  nightly: "offset",
  manual: "manual",
  "pre-restore": "pre-restore",
  "pre-update": "pre-update",
  uploaded: "uploaded",
};

/** Every name a backup can have. Nothing else in the folder is ever listed, served or restored. */
export const NAME = /^(offset|manual|pre-restore|pre-update|uploaded)-[0-9A-Za-z.-]{1,80}\.db$/;

export interface BackupMeta {
  format: 1;
  product: string;
  productName: string;
  version: string;
  createdAt: string;
  kind: BackupKind;
  evidenceFiles: number;
  evidenceMissing: number;
}

export interface BackupInfo {
  name: string;
  kind: BackupKind;
  size: number;
  createdAt: string;
  /** False for database-only copies: the ones taken before an update, and any from before this existed. */
  includesEvidence: boolean;
  evidenceFiles: number;
  version: string | null;
}

export class BackupError extends Error {}

export const refuse = (message: string): never => {
  throw new BackupError(message);
};

export const backupDir = (): string => resolve(config.BACKUP_DIR);

export const stamp = (): string => new Date().toISOString().replace(/[:.]/g, "-");

export function kindOf(name: string): BackupKind {
  const prefix = name.split("-")[0] === "pre" ? name.split("-").slice(0, 2).join("-") : name.split("-")[0];
  return (Object.entries(PREFIX).find(([, p]) => p === prefix)?.[0] ?? "nightly") as BackupKind;
}

/** The full path of a backup, but only for a name that could be one, and only inside the folder. */
export async function backupPath(name: string): Promise<string> {
  if (!NAME.test(name)) refuse("That is not the name of a backup.");
  const path = join(backupDir(), name);
  const info = await lstat(path).catch(() => null);
  if (!info?.isFile()) refuse("There is no backup with that name.");
  return path;
}


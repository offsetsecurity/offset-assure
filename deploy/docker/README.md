# Offset on Docker

Two containers, four volumes, no database server to run.

## Start it

```bash
cd deploy/docker
cp env.example .env
```

Fill in the two secrets `.env` asks for:

```bash
docker run --rm node:24-alpine node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run that twice — once for `SESSION_SECRET`, once for `FIELD_ENC_KEY` — then:

```bash
docker compose up -d --build
```

Open <http://localhost:8080>. The first person to open it creates the
administrator account.

## What runs

| Container | What it does | If it stops |
|---|---|---|
| `app` | The web interface and API on port 8080. Owns the schema and applies migrations at start-up. | Nobody can sign in. |
| `worker` | Nightly backup and pruning, the daily readiness snapshot, WAL checkpoints, housekeeping. | The product still works. Nothing is ever backed up. |

Both run from the same image and open the same SQLite file. That is safe:
writes are serialised and readers are never blocked.

**Do not scale `app` past one replica.** It is one file, and the schema is
applied at start-up, so a second copy would race the first. Scale a reverse
proxy in front instead — the bottleneck is never this.

## The four volumes

| Volume | Holds |
|---|---|
| `data` | The database. |
| `backups` | Backups: the database and every evidence document, one file each. **Copy these somewhere else.** |
| `evidence` | Uploaded evidence files. |
| `logs` | `app.log`, `worker.log`, `crash.log`. |

Both containers mount all four. Giving them separate volumes would give you
two databases and one of them would quietly be ignored.

### Keeping the data in a folder you choose

By default the four live in Docker's own storage. To keep them in a normal
folder instead, where you can see and copy them, set this in `.env` before the
first start:

```
OFFSET_DATA_DIR=D:/OffsetData/assure        # Windows: forward slashes
OFFSET_DATA_DIR=/srv/offset/assure          # Linux
```

The folder then holds `data`, `evidence`, `backups` and `logs`, and updates
keep using it. On Linux, give it to the application's user first:
`sudo chown -R 10001:10001 /srv/offset/assure`.

Changing it on an install that already has data does not move the data. Take a
backup and download it, set the folder, start again, then upload and restore
the backup from the **Backups** screen.

### If Docker or the server fails

The data is not inside the containers, so losing a container loses nothing.
How to get it back depends on where the data was kept:

- **In a folder (`OFFSET_DATA_DIR`).** Install Docker again, put the same
  `.env` back (it holds `OFFSET_DATA_DIR` and the secrets), and start. The
  application finds the folder and carries on: same records, same
  administrator, same password. On a new server, copy the folder across first.
- **In Docker's volumes.** If Docker's storage survived, starting again finds
  the volumes. If it did not, install afresh, sign in with a new
  administrator, and upload and restore your latest downloaded backup from the
  **Backups** screen.

Keep a copy of `.env` somewhere safe as well as the backups: its
`FIELD_ENC_KEY` decrypts the few stored secrets, such as the email server's
password. With a different key everything else comes back, but those secrets
must be entered again.

### Evidence files before 0.2.47

Until 0.2.47 the image did not tell the application where the `evidence` volume
was, so uploaded files were kept inside the container and an update lost them.
From 0.2.47 they are kept in the volume. On its first start, 0.2.47 also puts
back every missing file it can find in a backup: anything uploaded before the
last nightly or manual backup comes back. **Before updating from an earlier
version, take a manual backup from the Backups screen**, so nothing is missed.

Backups are easiest from the **Backups** screen: take, download, upload and
restore. The same full backup from the command line:

```bash
docker compose exec app node dist/db/backup.js
```

## Logs

```bash
docker compose logs -f app        # live
docker compose logs --tail=100 worker
```

The same lines are in the `logs` volume as files, rotating at 10 MB with five
older copies kept. Passwords, hashes, cookies and both secrets are stripped
before anything is written, so a log is safe to send to somebody.

See [logs and troubleshooting](../../docs/ops/logs-and-troubleshooting.md) for
what each file means and a symptom-to-cause table.

## A different product

One image per framework. `PRODUCT` in `.env` selects it and is baked in at
build time:

```ini
PRODUCT=assure   # ISO/IEC 27001:2022
PRODUCT=align    # NIST Cybersecurity Framework 2.0
PRODUCT=anchor   # NIST SP 800-53 Rev. 5
PRODUCT=ascend   # SAMA Cyber Security Framework (Offset Irtiqa)
```

The project, and so every volume, is named after the product: `offset-align`,
with `offset-align_data`, `offset-align_backups` and so on. Two products on one
machine therefore get two databases without anyone having to remember to ask
for them. The volume names in the commands above change with it.

## Before you expose it

The port is bound to `127.0.0.1` on purpose. **This product terminates no TLS
of its own**, so publishing it directly would put session cookies and
passwords on the wire in clear.

Put a reverse proxy in front, give it a certificate, and only then change the
port mapping in `compose.yaml` from `127.0.0.1:8080:8080` to `8080:8080`.

## Outgoing connections

Offset Assure connects to nothing outside the server by itself.

## Going back to the version before

Updates only add to the database, and an update takes a backup first.

1. The supported way: start the old version on empty volumes, create an
   administrator, then upload and restore the backup taken before the update
   (**Backups** screen). Everything is as it was before the update.
2. What was added after the update is not in that backup. Take a backup
   before going back if you may want it later.

If you updated with `docker compose up -d --build` and took no backup, there
is still a copy: every time a new version changes the database it first
copies it to `backups/before-upgrade/` (in the `backups` volume, the newest
three are kept). That copy is not listed on the **Backups** screen. To use it:

1. Stop the product: `docker compose down`.
2. Put the old version back (`git checkout v<old version>` in this folder).
3. Copy the file over the database, as root, and remove the two files beside it:
   ```bash
   docker compose run --rm --user 0 --entrypoint sh app -c \
     'cp /app/backups/before-upgrade/<file>.db /app/data/offset.db && rm -f /app/data/offset.db-wal /app/data/offset.db-shm && chown offset:offset /app/data/offset.db'
   ```
4. Start it: `docker compose up -d --build`. Sign in as before; everything is
   as it was just before the update.

This was tried on 15 Nov 2026: 0.3.0 back to 0.2.47, every record as it was.

## Updating

```bash
git pull
docker compose up -d --build
```

Migrations run at start-up and are idempotent. The volumes are untouched by a
rebuild. Take a backup first anyway — see above.

## Removing it

```bash
docker compose down            # stops it, keeps every volume
docker compose down -v         # ALSO DELETES THE DATABASE. There is no undo.
```

# Where your data lives

## On your own server

Everything is on the machine this runs on: one database file, one folder of
evidence documents, one folder of backups. There is no cloud service behind it
and no telemetry. Nothing leaves the building unless somebody presses a button
that sends it.

## Where the files are

| | Windows | Linux | Docker |
|---|---|---|---|
| The program | `C:\Program Files\Offset Security\Offset Assure` | `/opt/offset-assure` | In the image |
| Your data | `C:\ProgramData\Offset Security\Offset Assure` | `/var/lib/offset-assure` | Four volumes (`data`, `evidence`, `backups`, `logs`), or a folder you choose |

Your data is the database, the evidence documents, the backups, the logs and a
`.env` file of settings and secrets. An upgrade replaces the program and never
touches the data. On Windows, ProgramData is a hidden folder: type the path into
File Explorer's address bar.

## Docker: keeping the data in a folder you choose

By default Docker keeps the data in its own storage. To keep it in a normal
folder instead, where you can see it and copy it, set `OFFSET_DATA_DIR` in the
`.env` file before the first start, for example
`OFFSET_DATA_DIR=D:/OffsetData/assure` on Windows or
`OFFSET_DATA_DIR=/srv/offset/assure` on Linux. The Docker guide has the
details.

## If Docker or the server fails

Your data is not inside the containers, so losing a container loses nothing.

- **Data in a folder you chose:** install Docker again, put the same `.env`
  file back, and start. Everything is as it was: the same records, the same
  administrator and the same password. On a new server, copy the folder
  across first.
- **Data in Docker's own storage, and that storage is lost:** install afresh,
  create an administrator, then upload and restore your latest downloaded
  backup on the **Backups** screen.

Keep a copy of the `.env` file somewhere safe, as well as the backups. It
holds the key that unlocks stored passwords, such as the email server's.
Without the same key, everything else comes back, but those passwords must be
typed in again.

## Removing and installing again

Uninstalling removes the program and keeps your data, on purpose. So installing
again finds the old data and uses it: the same administrator and password, the
same records, and the same port. You are not asked to create an administrator,
because one exists.

To start from nothing, uninstall, delete the data folder, and install again.
**That erases the database, the evidence and the backups for good.** Forgot the
administrator password? Do not start fresh; the administrator guide shows how
to reset it.

## Backups

One is taken automatically every night. The folder keeps the newest three
backups in all, whether taken at night, by hand, or before an update or a
restore; older ones are deleted. Each backup is a single file holding the
database **and** every evidence document.

**Backups** lets an administrator take one now, download one, upload one, and
restore one. Restoring replaces everything, takes a backup of the present
first, and signs everybody out.

Download one regularly and keep it somewhere that is not this server.

## Updates

**Settings → Updates.** Nothing is checked or downloaded until an administrator
presses the button. An update takes a backup first, and if the new version does
not start properly the old one and your data are put back automatically.

## Who can see the documents you upload

Anyone who can sign in and read. Any kind of file can be uploaded, including
programs. Evidence is served as an attachment, never opened in the browser and
never run, so an uploaded file cannot run anything against your session or
your server. A person who downloads a file and opens it on their own computer
is in the same position as with any file sent by email, so open only what you
expect.

A backup file holds every document and every password hash, so treat one as you
would treat the server itself.

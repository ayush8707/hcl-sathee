# Database backups

A GitHub Action (`.github/workflows/db-backup.yml`) copies the Supabase
database every night at 02:00 India time, encrypts the copy, and keeps the
last 30 days of copies.

**Covered:** every table and row in the database (users, students, attendance,
marks, queries, announcements, settings, ...) plus the `platform_views` views.
Uploaded files (Supabase Storage: SATHEE MITRA selfies, marks sheets,
timetables, announcement attachments) are copied by a second Action,
`.github/workflows/files-backup.yml`, every Sunday at 03:00 India time; the
last 5 weeks are kept. See "Uploaded files" below.

## Find a backup

GitHub repository -> **Actions** -> **Database backup** -> click a run ->
scroll to **Artifacts** -> download `sathee-db-YYYY-MM-DD`. It is a zip that
contains `sathee-db-YYYY-MM-DD.dump.gpg`.

Make a backup right now: **Actions -> Database backup -> Run workflow**.

## Restore a backup

Only do this when data has really been lost. Restoring overwrites what is in
the target database, so the safest way is to restore into a **new, empty**
Supabase project first, check it, and copy back only what you need.

You need `gpg` and the PostgreSQL 17 client tools (`pg_restore`). GitHub
Codespaces has both once you run `sudo apt-get install -y postgresql-client`.

```bash
# 1. Unzip the download, then decrypt (asks for BACKUP_PASSPHRASE)
gpg --output sathee-db.dump --decrypt sathee-db-YYYY-MM-DD.dump.gpg

# 2. See what is inside (optional)
pg_restore --list sathee-db.dump | head -50

# 3. Restore into a database. TARGET_DB_URL is the "Session pooler"
#    connection string of the project you are restoring into.
pg_restore --dbname "$TARGET_DB_URL" --no-owner --no-privileges \
  --clean --if-exists sathee-db.dump
```

After restoring into a new project, run `enable_rls.sql` there too.

## Uploaded files

**One-time setup:** GitHub repository -> **Settings -> Secrets and variables
-> Actions -> New repository secret**, add `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` with the same values as on Render.
`BACKUP_PASSPHRASE` is shared with the database backup. If you ever change
the Supabase secret key on Render, change it here too.

**Find a backup:** Actions -> **Files backup** -> a run -> **Artifacts** ->
`sathee-files-YYYY-MM-DD`. Make one now with **Run workflow**.

**Restore:**

```bash
# 1. Unzip the download, then decrypt (asks for BACKUP_PASSPHRASE) and unpack
gpg --output sathee-files.tar.gz --decrypt sathee-files-YYYY-MM-DD.tar.gz.gpg
tar -xzf sathee-files.tar.gz
```

You get one folder per bucket (e.g. `sathee-uploads/...`) with the files at
their original paths, plus `manifest.json` listing them. To put a lost file
back, upload it in Supabase -> Storage -> that bucket, at the same path. The
links saved in the database point to those paths, so they work again once
the file is back.

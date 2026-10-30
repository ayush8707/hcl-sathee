# Database backups

A GitHub Action (`.github/workflows/db-backup.yml`) copies the Supabase
database every night at 02:00 India time, encrypts the copy, and keeps the
last 30 days of copies.

**Covered:** every table and row in the database (users, students, attendance,
marks, queries, announcements, settings, ...) plus the `platform_views` views.
**Not covered:** files uploaded to Supabase Storage (announcement attachments).

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

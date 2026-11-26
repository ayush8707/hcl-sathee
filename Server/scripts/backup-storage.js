/**
 * Copies every file in Supabase Storage (all buckets) into a local folder.
 * Used by .github/workflows/files-backup.yml; can also be run by hand:
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backup-storage.js ./out
 *
 * Writes <out>/<bucket>/<path> for every file plus <out>/manifest.json
 * (bucket, path, size). Exits with an error if any file could not be copied.
 */
const fs = require("fs/promises");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PAGE_SIZE = 1000;
const PARALLEL_DOWNLOADS = 5;

// Lists every file under `prefix`, walking into folders.
const listAll = async (bucket, prefix = "") => {
  const files = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await bucket.list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`Listing "${prefix || "/"}" failed: ${error.message}`);
    for (const item of data) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
      // Folders come back without an id.
      if (item.id === null || item.id === undefined) files.push(...(await listAll(bucket, itemPath)));
      else files.push({ path: itemPath, size: item.metadata?.size ?? null });
    }
    if (data.length < PAGE_SIZE) return files;
  }
};

// Runs `task` over `items`, `limit` at a time.
const runLimited = async (items, limit, task) => {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await task(items[next++]);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
};

const main = async () => {
  const outDir = path.resolve(process.argv[2] || "storage-backup");
  const url = (process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    throw new Error(
      `Listing buckets failed (${error.message || error.statusCode || "no details"}). ` +
        "Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const manifest = [];
  const failures = [];
  for (const { name } of buckets) {
    const bucket = supabase.storage.from(name);
    const files = await listAll(bucket);
    console.log(`${name}: ${files.length} files`);

    await runLimited(files, PARALLEL_DOWNLOADS, async (file) => {
      const target = path.join(outDir, name, file.path);
      // Never write outside the backup folder, whatever a stored name contains.
      if (!target.startsWith(path.join(outDir, name) + path.sep)) {
        failures.push(`${name}/${file.path}: unsafe path`);
        return;
      }
      const { data: blob, error: downloadError } = await bucket.download(file.path);
      if (downloadError) {
        failures.push(`${name}/${file.path}: ${downloadError.message}`);
        return;
      }
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, Buffer.from(await blob.arrayBuffer()));
      manifest.push({ bucket: name, path: file.path, size: file.size });
    });
  }

  await fs.mkdir(outDir, { recursive: true });
  manifest.sort((a, b) => `${a.bucket}/${a.path}`.localeCompare(`${b.bucket}/${b.path}`));
  await fs.writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Copied ${manifest.length} files from ${buckets.length} bucket(s).`);

  if (failures.length) {
    console.error(`${failures.length} file(s) could not be copied:\n  ${failures.join("\n  ")}`);
    process.exit(1);
  }
};

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

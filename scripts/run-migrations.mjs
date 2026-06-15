/**
 * Careroot Migration Runner
 * Runs all SQL migrations against Supabase using the service role key
 * via the Supabase Management API (pg query endpoint).
 *
 * Usage: node scripts/run-migrations.mjs
 *
 * Requires SUPABASE_ACCESS_TOKEN environment variable OR
 * reads from .env.local if not set.
 */

import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Load .env.local manually
function loadEnv() {
  try {
    const env = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of env.split("\n")) {
      const [key, ...rest] = line.split("=");
      if (key && rest.length) {
        process.env[key.trim()] = rest.join("=").trim();
      }
    }
  } catch {}
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Extract project ref from URL
const PROJECT_REF = SUPABASE_URL?.replace("https://", "").replace(".supabase.co", "");

if (!SERVICE_ROLE_KEY || !PROJECT_REF) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

// The Supabase Management API requires a personal access token.
// If you have one, set SUPABASE_ACCESS_TOKEN in your environment.
// Otherwise we use the pg-meta endpoint which works with service_role.
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function runSQL(sql, migrationName) {
  // Try Management API first (requires personal access token)
  if (ACCESS_TOKEN) {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ query: sql }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return data;
  }

  // Fallback: pg-meta endpoint (available in self-hosted, may work on cloud)
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ sql }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  const migrationsDir = join(ROOT, "supabase", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`\n🌱 Careroot Migration Runner`);
  console.log(`📍 Project: ${PROJECT_REF}`);
  console.log(`📂 Found ${files.length} migration files\n`);

  let success = 0;
  let failed = 0;

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    try {
      await runSQL(sql, file);
      console.log(`  ✅ ${file}`);
      success++;
    } catch (err) {
      // "already exists" errors are OK on re-run
      if (err.message?.includes("already exists")) {
        console.log(`  ⏭️  ${file} (already exists — skipped)`);
        success++;
      } else {
        console.error(`  ❌ ${file}: ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\n📊 Results: ${success} succeeded, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch(console.error);

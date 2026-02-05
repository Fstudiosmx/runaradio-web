#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const DEFAULT_DB_PATH = path.join(ROOT, "docs/data/default-db.json");
const LIVE_CACHE_PATH = path.join(ROOT, "docs/data/live-cache.json");
const SCHEDULE_CACHE_PATH = path.join(ROOT, "docs/data/schedule-cache.json");
const FETCH_TIMEOUT_MS = 10000;

function parseArg(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function fetchJson(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutRef = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status} @ ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timeoutRef);
  }
}

async function cmdSync() {
  const baseUrl = parseArg("--base-url", "https://libretime.kusmedios.lat");
  const fetchedAt = new Date().toISOString();

  const endpoints = [
    { key: "liveInfo", url: `${baseUrl}/api/live-info-v2` },
    { key: "status", url: `${baseUrl}/api/status` },
    { key: "weekInfo", url: `${baseUrl}/api/week-info` }
  ];

  const results = await Promise.all(
    endpoints.map(async ({ key, url }) => {
      try {
        const data = await fetchJson(url);
        return { key, data, ok: true };
      } catch (error) {
        return { key, data: null, ok: false, error: error.message };
      }
    })
  );

  const liveInfo = results.find((item) => item.key === "liveInfo");
  const status = results.find((item) => item.key === "status");
  const weekInfo = results.find((item) => item.key === "weekInfo");

  if (liveInfo.ok || status.ok) {
    await writeJson(LIVE_CACHE_PATH, {
      source: baseUrl,
      fetchedAt,
      liveInfo: liveInfo.data,
      status: status.data
    });
  }

  if (weekInfo.ok) {
    await writeJson(SCHEDULE_CACHE_PATH, {
      source: baseUrl,
      fetchedAt,
      weekInfo: weekInfo.data
    });
  }

  const failed = results.filter((item) => !item.ok);
  if (failed.length > 0) {
    console.warn("⚠️ Sync parcial. Endpoints fallidos:");
    failed.forEach((item) => console.warn(`  - ${item.key}: ${item.error}`));

    if (failed.length === results.length) {
      throw new Error("No se pudo sincronizar ningún endpoint de LibreTime");
    }
  }

  console.log("✅ Sync completado.");
}

async function cmdSeedAdmin() {
  const username = parseArg("--user", "admin");
  const password = parseArg("--password", "runaradio123");
  const db = await readJson(DEFAULT_DB_PATH);

  db.admin.users = [{
    username,
    passwordHash: sha256(password),
    role: "superadmin"
  }];

  db.admin.updatedAt = new Date().toISOString();
  await writeJson(DEFAULT_DB_PATH, db);
  console.log(`✅ Admin actualizado: ${username}`);
}

async function cmdExport() {
  const output = parseArg("--out", path.join(ROOT, "runaradio-db-export.json"));
  const db = await readJson(DEFAULT_DB_PATH);
  await writeJson(output, db);
  console.log(`✅ Export generado en ${output}`);
}

function printHelp() {
  console.log(`RunaRadio CLI

Uso:
  node cli/runaradio-cli.mjs sync [--base-url https://libretime.kusmedios.lat]
  node cli/runaradio-cli.mjs seed-admin [--user admin] [--password secret]
  node cli/runaradio-cli.mjs export [--out ./runaradio-db-export.json]
`);
}

async function main() {
  const command = process.argv[2] || "help";

  if (command === "sync") return cmdSync();
  if (command === "seed-admin") return cmdSeedAdmin();
  if (command === "export") return cmdExport();

  printHelp();
}

main().catch((error) => {
  console.error("❌ Error CLI:", error.message);
  process.exitCode = 1;
});

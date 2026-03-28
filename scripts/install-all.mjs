#!/usr/bin/env node
/**
 * Полная установка и запуск одной командой (после git clone, при установленном Node.js 20+):
 *
 *   node scripts/install-all.mjs
 *
 * Выполняет: npm install → setup (Prisma + build) → npm start
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: "inherit", shell: true, env: process.env });
}

const major = Number.parseInt(process.version.slice(1).split(".")[0] ?? "0", 10);
if (major < 20) {
  console.error(`Требуется Node.js 20+. Текущая версия: ${process.version}`);
  process.exit(1);
}

console.log("→ npm install\n");
run("npm install");

console.log("\n→ node scripts/setup.mjs\n");
run("node scripts/setup.mjs");

console.log("\n→ npm start (Ctrl+C для остановки)\n");
run("npm start");

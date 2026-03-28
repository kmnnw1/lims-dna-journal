#!/usr/bin/env node
/**
 * Подготовка к запуску: .env, Prisma, production build.
 * Вызывается после npm install или из install-all.mjs.
 */
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
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

const envPath = join(root, ".env");
const examplePath = join(root, ".env.example");

if (!existsSync(envPath)) {
  if (!existsSync(examplePath)) {
    console.error("Не найден .env.example — репозиторий повреждён?");
    process.exit(1);
  }
  copyFileSync(examplePath, envPath);
  console.log("Создан .env из .env.example");
}

let envText = readFileSync(envPath, "utf8");

if (/^NEXTAUTH_SECRET=\s*$/m.test(envText) || /^NEXTAUTH_SECRET=$/m.test(envText)) {
  const secret = randomBytes(32).toString("base64");
  envText = envText.replace(/^NEXTAUTH_SECRET=.*$/m, `NEXTAUTH_SECRET="${secret}"`);
  writeFileSync(envPath, envText);
  console.log("Сгенерирован NEXTAUTH_SECRET в .env");
}

if (!/^DATABASE_URL=/m.test(envText)) {
  envText += `\nDATABASE_URL="file:./dev.db"\n`;
  writeFileSync(envPath, envText);
  console.log("Добавлен DATABASE_URL в .env");
}

console.log("\n→ prisma generate\n");
run("npx prisma generate");

console.log("\n→ prisma db push\n");
run("npx prisma db push");

console.log("\n→ npm run build\n");
run("npm run build");

console.log("\nГотово. Запуск: npm start\n");

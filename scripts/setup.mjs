#!/usr/bin/env node
/**
 * Усовершенствованная подготовка проекта: настройка .env, Prisma, сборка.
 * Запускается после npm install либо из install-all.mjs.
 */

import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Определение корня проекта
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Универсальная функция для запуска команд с выводом и обработкой ошибок
function run(cmd, title) {
  if (title) {
    console.log(`\n→ ${title}\n`);
  }
  try {
    execSync(cmd, {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: process.env
    });
  } catch (err) {
    console.error(`❌ Ошибка выполнения '${cmd}':\n`, err?.message || err);
    process.exit(1);
  }
}

// Проверка версии Node.js
(function checkNodeVersion(required = 20) {
  const major = Number.parseInt(process.version.slice(1).split(".")[0] ?? "0", 10);
  if (major < required) {
    console.error(`❌ Требуется Node.js ${required}+. Обнаружено: ${process.version}`);
    process.exit(1);
  }
})();

// Пути к .env и .env.example
const envPath = join(root, ".env");
const examplePath = join(root, ".env.example");

// Создание .env при необходимости
if (!existsSync(envPath)) {
  if (!existsSync(examplePath)) {
    console.error("❌ Не найден .env.example — проверьте репозиторий!");
    process.exit(1);
  }
  copyFileSync(examplePath, envPath);
  console.log("✅ Создан .env из .env.example");
}

// Чтение и обновление .env
let envText = readFileSync(envPath, "utf8");
let modified = false;

// Генерация NEXTAUTH_SECRET, если он отсутствует или пустой
if (/^NEXTAUTH_SECRET=\s*$/m.test(envText) || /^NEXTAUTH_SECRET=$/m.test(envText)) {
  const secret = randomBytes(32).toString("base64");
  envText = envText.replace(/^NEXTAUTH_SECRET=.*$/m, `NEXTAUTH_SECRET="${secret}"`);
  modified = true;
  console.log("🔑 Сгенерирован новый NEXTAUTH_SECRET в .env");
}

// Добавление DATABASE_URL, если отсутствует
if (!/^DATABASE_URL=/m.test(envText)) {
  envText += `\nDATABASE_URL="file:./dev.db"\n`;
  modified = true;
  console.log("🗄️ Добавлен DATABASE_URL в .env (SQLite dev.db)");
}

// Только если были изменения — сохраняем .env
if (modified) {
  writeFileSync(envPath, envText);
}

// Запуск Prisma и сборки с пользовательскими сообщениями
run("npx prisma generate", "prisma generate");
run("npx prisma db push", "prisma db push (миграция схемы)");
run("npm run build", "npm run build");

// Итоговое сообщение
console.log("\n🟢 Готово! Проект подготовлен.\n👉 Для запуска используйте: npm start\n");

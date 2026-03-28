/**
 * Копия SQLite dev.db в backups/dev-<timestamp>.db
 * Запуск: node scripts/backup-db.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const db = path.join(root, "prisma", "dev.db");
const dir = path.join(root, "backups");
if (!fs.existsSync(db)) {
  console.error("Нет файла:", db);
  process.exit(1);
}
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const dest = path.join(dir, `dev-${ts}.db`);
fs.copyFileSync(db, dest);
console.log(dest);

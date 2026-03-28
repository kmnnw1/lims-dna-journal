/**
 * Растеризует public/icon.svg в PNG для манифеста PWA и Apple Touch Icon.
 * Запуск: node scripts/gen-pwa-icons.mjs
 */
import sharp from "sharp";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svg = readFileSync(join(root, "public", "icon.svg"));

const sizes = [
  [192, "icon-192.png"],
  [512, "icon-512.png"],
  [180, "apple-touch-icon.png"],
];

for (const [size, name] of sizes) {
  const out = join(root, "public", name);
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log("Wrote", name);
}

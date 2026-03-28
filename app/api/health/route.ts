import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

/** Проверка живости сервиса (балансировщики, мониторинг, ручная диагностика). */
export async function GET() {
  let version = "0.0.0";
  try {
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf8");
    version = (JSON.parse(raw) as { version?: string }).version ?? version;
  } catch {
    /* ignore */
  }
  return NextResponse.json({
    ok: true,
    service: "lab-journal",
    version,
    time: new Date().toISOString(),
  });
}

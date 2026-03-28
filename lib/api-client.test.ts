import { describe, it, expect } from "vitest";
import { parseApiResponse } from "./api-client";

describe("parseApiResponse", () => {
  it("returns ok with parsed JSON", async () => {
    const res = new Response(JSON.stringify({ a: 1 }), { status: 200 });
    const r = await parseApiResponse<{ a: number }>(res);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.a).toBe(1);
  });

  it("returns message on error field", async () => {
    const res = new Response(JSON.stringify({ error: "Нет прав" }), { status: 403 });
    const r = await parseApiResponse(res);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBe("Нет прав");
  });

  it("handles invalid JSON body", async () => {
    const res = new Response("not json", { status: 500 });
    const r = await parseApiResponse(res);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("Некорректный");
  });
});

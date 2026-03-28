/** Разбор JSON и извлечение поля `error` при ответе с ошибкой. */
export async function parseApiResponse<T>(
  res: Response
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const text = await res.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    return { ok: false, message: "Некорректный ответ сервера" };
  }
  if (!res.ok) {
    const err = (data as { error?: string }).error;
    const msg =
      typeof err === "string" && err.length > 0 ? err : `Ошибка ${res.status}`;
    return { ok: false, message: msg };
  }
  return { ok: true, data: data as T };
}

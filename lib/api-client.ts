/** Разбор JSON, извлечение поля `error` или `message` для ошибок, более тщательная диагностика. */
export async function parseApiResponse<T>(
  res: Response
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  let text: string;
  try {
    text = await res.text();
  } catch {
    return { ok: false, message: "Ошибка соединения с сервером" };
  }

  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    return {
      ok: false,
      message:
        text.trim().length === 0
          ? "Пустой или некорректный ответ сервера"
          : "Некорректный ответ сервера: не удалось разобрать JSON",
    };
  }

  // При ошибке ищем `message`, затем `error`, затем статус
  if (!res.ok) {
    let msg = "";
    if (typeof data?.message === "string" && data.message.trim().length > 0) {
      msg = data.message.trim();
    } else if (typeof data?.error === "string" && data.error.trim().length > 0) {
      msg = data.error.trim();
    } else if (typeof data === "string" && data.trim().length > 0) {
      msg = data.trim();
    } else {
      msg = `Ошибка ${res.status}`;
    }
    return { ok: false, message: msg };
  }

  // Даже если res.ok, проверим, нет ли на верхнем уровне стандартных error-сообщений
  if (
    typeof data?.error === "string" &&
    data.error.trim().length > 0
  ) {
    return { ok: false, message: data.error.trim() };
  }
  if (
    typeof data?.message === "string" &&
    data.message.trim().length > 0
  ) {
    return { ok: false, message: data.message.trim() };
  }

  return { ok: true, data: data as T };
}

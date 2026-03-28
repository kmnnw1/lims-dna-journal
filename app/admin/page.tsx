"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { UserPlus, ShieldAlert, Trash2, ArrowLeft, Database, FileSpreadsheet, Save } from "lucide-react";
import Link from "next/link";
import { parseApiResponse } from "@/lib/api-client";

function UserRow({
  user: u,
  fieldClass,
  onUpdate,
  onDelete,
}: {
  user: { id: string; username: string; role: string };
  fieldClass: string;
  onUpdate: (id: string, role: string, password?: string) => void;
  onDelete: (id: string) => void;
}) {
  const [role, setRole] = useState(u.role);
  const [pwd, setPwd] = useState("");
  useEffect(() => setRole(u.role), [u.role]);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950/50 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium">{u.username}</p>
        <p className="text-xs text-zinc-500">{u.role}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {u.username !== "admin" ? (
          <>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={`${fieldClass} max-w-[11rem]`}>
              <option value="EDITOR">EDITOR</option>
              <option value="READER">READER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <input
              type="password"
              placeholder="Новый пароль"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className={`${fieldClass} max-w-[10rem]`}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => onUpdate(u.id, role, pwd)}
              className="inline-flex items-center gap-1 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-500"
            >
              <Save className="h-4 w-4" />
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => onDelete(u.id)}
              className="rounded-xl p-2 text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/50"
              aria-label="Удалить"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </>
        ) : (
          <span className="text-xs text-zinc-400">Главный администратор</span>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [toast, setToast] = useState("");
  const [importBusy, setImportBusy] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    if (session?.user?.role === "ADMIN") fetchUsers();
  }, [session]);

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const result = await parseApiResponse<{ id: string; username: string; role: string }[]>(res);
    if (!result.ok) {
      showToast(result.message);
      return;
    }
    setUsers(Array.isArray(result.data) ? result.data : []);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
    });
    const parsed = await parseApiResponse(res);
    if (!parsed.ok) {
      showToast(parsed.message);
      return;
    }
    setUsername("");
    setPassword("");
    showToast("Пользователь создан");
    fetchUsers();
  };

  const handleUpdateUser = async (id: string, newRole: string, newPassword?: string) => {
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        role: newRole,
        ...(newPassword && newPassword.length > 0 ? { password: newPassword } : {}),
      }),
    });
    const parsed = await parseApiResponse(res);
    if (!parsed.ok) {
      showToast(parsed.message);
      return;
    }
    showToast("Пользователь обновлён");
    fetchUsers();
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Точно удалить?")) return;
    const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    const parsed = await parseApiResponse(res);
    if (!parsed.ok) {
      showToast(parsed.message);
      return;
    }
    showToast("Удалено");
    fetchUsers();
  };

  const handleClearSpecimens = async () => {
    if (!confirm("Удалить все пробы из базы? Попытки ПЦР тоже удалятся.")) return;
    setImportBusy(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      const result = await parseApiResponse<{ message?: string; deleted?: number }>(res);
      if (!result.ok) {
        showToast(result.message);
        return;
      }
      showToast(result.data.message ?? `Удалено: ${result.data.deleted ?? 0}`);
    } finally {
      setImportBusy(false);
    }
  };

  const handleImportFromExcel = async () => {
    if (
      !confirm(
        "Удалить все текущие пробы и загрузить data.xlsx из корня проекта? (все листы файла.)"
      )
    )
      return;
    setImportBusy(true);
    try {
      const res = await fetch("/api/import");
      const result = await parseApiResponse<{
        message?: string;
        sheets?: number;
        rows?: number;
      }>(res);
      if (!result.ok) {
        showToast(result.message);
        return;
      }
      showToast(result.data.message ?? "Импорт завершён");
    } finally {
      setImportBusy(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-100 p-8 dark:bg-zinc-950">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-48 animate-pulse rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/80" />
        </div>
      </div>
    );
  }
  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4 text-center dark:bg-zinc-950">
        <ShieldAlert className="mb-4 h-16 w-16 text-rose-600" />
        <p className="max-w-md text-lg font-semibold text-zinc-900 dark:text-zinc-100">Доступ запрещён. Нужна роль администратора.</p>
        <Link href="/" className="mt-6 rounded-2xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500">
          На главную
        </Link>
      </div>
    );
  }

  const field =
    "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/15 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100";

  return (
    <div className="min-h-screen bg-zinc-100 p-4 pb-[max(2rem,env(safe-area-inset-bottom,0px))] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:p-8">
      {toast && (
        <div className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] left-4 z-50 max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-200/80 bg-white/95 px-5 py-3 text-sm shadow-xl backdrop-blur-md sm:left-auto sm:right-6 dark:border-zinc-600 dark:bg-zinc-900/95">
          {toast}
        </div>
      )}
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-teal-700 transition hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300">
        <ArrowLeft className="h-4 w-4" /> К журналу
      </Link>

      <h1 className="mb-8 flex flex-wrap items-center gap-3 text-2xl font-semibold tracking-tight">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white shadow-md">
          <UserPlus className="h-6 w-6" strokeWidth={1.75} />
        </span>
        Администрирование
      </h1>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-3 rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm dark:border-amber-900/40 dark:from-amber-950/40 dark:to-zinc-900">
          <h2 className="mb-2 flex items-center gap-2 font-semibold">
            <Database className="h-5 w-5 text-amber-700 dark:text-amber-400" />
            Импорт проб (Excel)
          </h2>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Импорт обрабатывает все листы файла <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">data.xlsx</code> в корне каталога приложения на сервере.
            Перед загрузкой таблица проб очищается.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={importBusy}
              onClick={handleImportFromExcel}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Импортировать
            </button>
            <button
              type="button"
              disabled={importBusy}
              onClick={handleClearSpecimens}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200 dark:hover:bg-rose-900/50"
            >
              <Trash2 className="h-4 w-4" />
              Очистить пробы
            </button>
          </div>
        </div>

        <form onSubmit={handleCreateUser} className="h-fit rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60 md:col-span-1">
          <h2 className="mb-4 font-semibold">Новый пользователь</h2>
          <input required type="text" placeholder="Логин" value={username} onChange={(e) => setUsername(e.target.value)} className={`${field} mb-3`} />
          <input required type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className={`${field} mb-3`} />
          <select value={role} onChange={(e) => setRole(e.target.value)} className={`${field} mb-4`}>
            <option value="EDITOR">Редактор (EDITOR)</option>
            <option value="READER">Только чтение (READER)</option>
            <option value="ADMIN">Администратор (ADMIN)</option>
          </select>
          <button className="w-full rounded-2xl bg-teal-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-500 dark:bg-teal-500">Создать</button>
        </form>

        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60 md:col-span-2">
          <h2 className="mb-4 font-semibold">Пользователи</h2>
          <div className="space-y-2">
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                fieldClass={field}
                onUpdate={handleUpdateUser}
                onDelete={handleDeleteUser}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { FlaskConical, AlertCircle, ArrowRight } from "lucide-react";

function LoginContent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Неверный логин или пароль");
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      setError("Произошла ошибка при входе");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-sans text-zinc-900 dark:text-zinc-100 relative overflow-hidden">
      
      {/* Декоративные круги на фоне */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-teal-600/5 dark:bg-teal-900/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-600/5 dark:bg-emerald-900/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-[420px] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl dark:shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-8 sm:p-10 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm rotate-3">
            <FlaskConical className="w-10 h-10 -rotate-3" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Добро пожаловать</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            Лабораторный журнал (LIMS)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-4">
              Имя пользователя (Логин)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-3xl border-none bg-zinc-100/80 dark:bg-zinc-800/80 px-6 py-4 text-base outline-none focus:ring-2 focus:ring-teal-600 dark:focus:bg-zinc-800 transition-all placeholder:text-zinc-400"
              placeholder="Введите логин"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-4">
              Пароль
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-3xl border-none bg-zinc-100/80 dark:bg-zinc-800/80 px-6 py-4 text-base outline-none focus:ring-2 focus:ring-teal-600 dark:focus:bg-zinc-800 transition-all placeholder:text-zinc-400"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full px-6 py-4 text-base font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Войти в систему
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
#!/usr/bin/env sh
# ===============================
# 🚀 Универсальная установка (Linux/macOS)
# После git clone из корня проекта:
#   chmod +x scripts/install.sh && ./scripts/install.sh
# ===============================

set -eu

# Перейти в корень репозитория
cd -- "$(dirname "$0")/.."

# Проверка наличия Node.js 20+
if ! command -v node >/dev/null 2>&1; then
  printf >&2 "\033[1;31m❌ Не установлен Node.js! Пожалуйста, установите Node.js 20+ и повторите команду.\033[0m\n"
  exit 1
fi

node_major=$(node -v | sed 's/v\([0-9][0-9]*\).*/\1/')
if [ "$node_major" -lt 20 ]; then
  printf >&2 "\033[1;31m❌ Требуется Node.js 20+, обнаружено: $(node -v)\033[0m\n"
  exit 1
fi

echo "→ Запуск полной подготовки проекта..."

exec node scripts/install-all.mjs

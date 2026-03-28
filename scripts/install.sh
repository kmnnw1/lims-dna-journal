#!/usr/bin/env sh
# Полная установка и запуск (Linux, macOS). После клонирования:
#   chmod +x scripts/install.sh && ./scripts/install.sh

set -e
cd "$(dirname "$0")/.."
exec node scripts/install-all.mjs

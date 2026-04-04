# 🚀 Полная установка и запуск (Windows PowerShell)
# Запустите из корня репозитория:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/install.ps1

$ErrorActionPreference = "Stop"
try {
    Set-Location (Split-Path -Parent $PSScriptRoot)
    # Проверка Node.js
    $nodeVersion = & node -v 2>$null
    if (-not $nodeVersion) {
        Write-Host "❌ Node.js не найден! Установите Node.js 20+ и повторите попытку." -ForegroundColor Red
        exit 1
    }
    $major = [int]($nodeVersion -replace "[^0-9]", "").Substring(0,2)
    if ($major -lt 20) {
        Write-Host "❌ Требуется Node.js 20+, установлено: $nodeVersion" -ForegroundColor Red
        exit 1
    }

    Write-Host "`n→ Запуск установки и подготовки проекта...`n" -ForegroundColor Cyan
    node scripts/install-all.mjs
}
catch {
    Write-Host "`n❌ Установка прервана из-за ошибки: $_" -ForegroundColor Red
    exit 1
}

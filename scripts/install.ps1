# Полная установка и запуск (Windows PowerShell). Из корня репозитория:
#   powershell -ExecutionPolicy Bypass -File scripts/install.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
node scripts/install-all.mjs

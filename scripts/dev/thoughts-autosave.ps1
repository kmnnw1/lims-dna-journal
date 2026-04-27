# Скрипт автосохранения мыслей Павла
# СТАТУС: АКТИВЕН

$thoughtsPath = "THOUGHTS.md"
$agentsPath = "AGENTS.md"

function Get-FileHash-Simple($path) {
    if (Test-Path $path) {
        return (Get-Item $path).LastWriteTime.Ticks
    }
    return 0
}

$lastThoughtsHash = Get-FileHash-Simple $thoughtsPath
$lastAgentsHash = Get-FileHash-Simple $agentsPath

Write-Host "🚀 Thoughts Autosave Daemon started..." -ForegroundColor Cyan

while ($true) {
    Start-Sleep -Seconds 300 # 5 минут

    $currentThoughtsHash = Get-FileHash-Simple $thoughtsPath
    $currentAgentsHash = Get-FileHash-Simple $agentsPath

    if ($currentThoughtsHash -ne $lastThoughtsHash) {
        Write-Host "📂 THOUGHTS.md изменился. Сохраняю..." -ForegroundColor Yellow
        git add $thoughtsPath
        git commit -m "chore: автосохранение мыслей Павла" --no-verify
        $lastThoughtsHash = $currentThoughtsHash
    }

    if ($currentAgentsHash -ne $lastAgentsHash) {
        Write-Host "📜 AGENTS.md изменился. Синхронизирую..." -ForegroundColor Yellow
        git add $agentsPath
        git commit -m "chore: обновление правил агентов" --no-verify
        $lastAgentsHash = $currentAgentsHash
    }
}

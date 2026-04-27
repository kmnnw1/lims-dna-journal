# Modernization Guardian (Phase 2)
# Автоматизированная система контроля актуальности стека Lab-Journal
# СТАТУС: MASTERPIECE | ВЕРСИЯ: 2026.04.20 | РЕЖИМ: AUTONOMOUS

param(
    [switch]$Fix,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8

function Write-GuardianHeader {
    Write-Output "`n  ┌──────────────────────────────────────────────────────────┐"
    Write-Output "  │   🚀 MODERNIZATION GUARDIAN v2.1 - LAB-JOURNAL INFRA     │"
    Write-Output "  └──────────────────────────────────────────────────────────┘`n"
}

function Get-LocalNodeVersion {
    if (Test-Path "package.json") {
        $pkg = Get-Content -Raw "package.json" | ConvertFrom-Json
        return $pkg.engines.node.Replace(">=", "").Trim()
    }
    return "0.0.0"
}

function Get-LatestNodeVersions {
    Write-Output "  🔍 Опрашиваю реестр Node.js..."
    try {
        $data = Invoke-RestMethod -Uri "https://nodejs.org/dist/index.json" -TimeoutSec 5
        $lts = ($data | Where-Object { $_.lts -ne $false })[0].version.Replace("v", "")
        $current = $data[0].version.Replace("v", "")
        return @{ lts = $lts; current = $current }
    } catch {
        Write-Output "  ⚠️  Ошибка подключения. Использую статические данные (апрель 2026)."
        return @{ lts = "24.0.0"; current = "24.0.0" }
    }
}

function Test-DockerfileModernity {
    if (Test-Path "Dockerfile") {
        $content = Get-Content "Dockerfile"
        $hasBuildKit = $content -match "--mount=type=cache"
        $match = $content | Select-String "FROM node:(\d+)"
        $nodeVersion = if ($match) { $match.Matches.Groups[1].Value } else { "Unknown" }
        return @{ buildKit = $hasBuildKit; node = $nodeVersion }
    }
    return @{ buildKit = $false; node = "Unknown" }
}

function Update-NodeEngine {
    param($NewVersion)
    Write-Output "  🛠️  Обновляю package.json до $NewVersion..."
    $content = Get-Content "package.json" -Raw
    $newContent = $content -replace '"node": ">=.*?"', "`"node`": `">=$NewVersion`""
    $newContent | Set-Content "package.json" -Encoding UTF8
    Write-Output "  ✅ package.json пропатчен."
}

function Update-DockerImage {
    param($NewVersion)
    Write-Output "  🛠️  Обновляю Dockerfile до Node $NewVersion..."
    $content = Get-Content "Dockerfile"
    $newContent = $content -replace 'FROM node:[^ ]+', "FROM node:$NewVersion-slim"
    $newContent | Set-Content "Dockerfile" -Encoding UTF8
    Write-Output "  ✅ Dockerfile пропатчен."
}

Write-GuardianHeader

$localNode = Get-LocalNodeVersion
$remoteNode = Get-LatestNodeVersions
$dockerInfo = Test-DockerfileModernity

Write-Output "  ----------------------------------------------------------"
Write-Output "  КОМПОНЕНТ           ТЕКУЩАЯ    АКТУАЛЬНАЯ   СТАТУС"
Write-Output "  ----------------------------------------------------------"

# Node.js Check
$status = "OK"
if ($localNode -lt $remoteNode.current) {
    $status = if ($localNode -lt $remoteNode.lts) { "CRITICAL" } else { "STALE" }
}
Write-Output "  Node.js (Engine)    $($localNode.PadRight(10)) $($remoteNode.current.PadRight(12)) $status"

# Docker Image Check
$dockerStatus = if ($dockerInfo.node -lt ([int]$remoteNode.current.Split('.')[0])) { "STALE" } else { "OK" }
Write-Output "  Docker (Base)       $($dockerInfo.node.PadRight(10)) $($remoteNode.current.Split('.')[0].PadRight(12)) $dockerStatus"

# BuildKit Check
$bkStatus = if ($dockerInfo.buildKit) { "ENABLED" } else { "DISABLED" }
Write-Output "  Docker BuildKit     -          -            $bkStatus"

Write-Output "  ----------------------------------------------------------"

if ($Fix) {
    Write-Output "`n  🚀 Запущен режим исправления..."
    if ($status -ne "OK") { Update-NodeEngine -NewVersion $remoteNode.current }
    if ($dockerStatus -ne "OK") { Update-DockerImage -NewVersion $remoteNode.current.Split('.')[0] }
    Write-Output "  ✨ Все исправления применены. Потребуется 'git commit'."
} elseif ($status -ne "OK" -or $dockerStatus -ne "OK" -or $bkStatus -eq "DISABLED") {
    Write-Output "`n  💡 РЕКОМЕНДАЦИЯ: Запустите 'scripts/modernize.ps1 -Fix' для автоматического патча."
} else {
    Write-Output "`n  🌟 ИНФРАСТРУКТУРА СООТВЕТСТВУЕТ СТАНДАРТУ PHASE 2."
}

Write-Output "`n"

#!/usr/bin/env node
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const now = new Date();
const ts = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, '');
const target = join(root, 'support', `logs-${ts}`);
const patterns = ['*.log', 'npm-debug.log*', 'playwright-report', 'test-results', '.env', 'package.json', 'package-lock.json', 'Dockerfile', 'docker-compose.yml'];

function collectFile(source, destination) {
    try {
        copyFileSync(source, destination);
        console.log(`✅ ${source} → ${destination}`);
    } catch (error) {
        console.warn(`⚠️ Не удалось скопировать ${source}: ${error?.message || error}`);
    }
}

function globCopy(pattern) {
    const [prefix, suffix] = pattern.split('*');
    readdirSync(root).forEach((name) => {
        if (pattern === name || (prefix && suffix && name.startsWith(prefix) && name.endsWith(suffix))) {
            const source = join(root, name);
            const dest = join(target, name);
            collectFile(source, dest);
        }
    });
}

function copyTree(sourcePath, targetPath) {
    if (!existsSync(sourcePath)) return;
    mkdirSync(targetPath, { recursive: true });
    readdirSync(sourcePath).forEach((entry) => {
        const sourceEntry = join(sourcePath, entry);
        const targetEntry = join(targetPath, entry);
        if (statSync(sourceEntry).isDirectory()) {
            copyTree(sourceEntry, targetEntry);
        } else {
            collectFile(sourceEntry, targetEntry);
        }
    });
}

mkdirSync(target, { recursive: true });
console.log(`📦 Собираю поддержку логов в ${target}`);

for (const pattern of patterns) {
    if (pattern.includes('*')) {
        globCopy(pattern);
        continue;
    }

    const source = join(root, pattern);
    if (existsSync(source)) {
        const dest = join(target, pattern);
        if (statSync(source).isDirectory()) {
            copyTree(source, dest);
        } else {
            collectFile(source, dest);
        }
    }
}

console.log('🟢 Поддержка логов готова.');

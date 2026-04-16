import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

// 1. Пути
const oldComponentsDir = path.join(rootDir, 'app', 'components');
const newFeaturesDir = path.join(rootDir, 'components', 'features');
const pageFile = path.join(rootDir, 'app', 'page.tsx');

console.log('🚀 Начинаем операцию "Анти-Напарник"...');

// Функция для рекурсивного перемещения файлов
function moveFiles(src: string, dest: string) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            moveFiles(srcPath, destPath);
        } else {
            // Если файл уже есть в папке назначения, не перезаписываем (напарник мог обновить его там)
            if (!fs.existsSync(destPath)) {
                fs.renameSync(srcPath, destPath);
                console.log(`✅ Перемещено: ${entry.name}`);
            } else {
                console.log(`⚠️ Пропущено (уже есть): ${entry.name}`);
            }
        }
    }
}

// 2. Перемещаем файлы из app/components в root components/features
console.log('📦 Переносим компоненты...');
moveFiles(oldComponentsDir, newFeaturesDir);

// 3. Удаляем старую папку app/components
if (fs.existsSync(oldComponentsDir)) {
    fs.rmSync(oldComponentsDir, { recursive: true, force: true });
    console.log('🗑️ Старая папка app/components удалена.');
}

// 4. Правим импорты в page.tsx
if (fs.existsSync(pageFile)) {
    console.log('📝 Исправляем импорты в page.tsx...');
    let content = fs.readFileSync(pageFile, 'utf8');

    // Заменяем старые пути на новые с учетом папки features
    const updatedContent = content
        .replace(/from '@\/components\/StatsCards'/g, "from '@/components/features/StatsCards'")
        .replace(/from '@\/components\/SpecimenTable'/g, "from '@/components/features/SpecimenTable'");

    fs.writeFileSync(pageFile, updatedContent);
    console.log('✨ Импорты обновлены!');
}

console.log('\n🎉 Готово! Лапки могут отдыхать. Проверь проект в VS Code.');

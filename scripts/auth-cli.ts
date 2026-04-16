import { PrismaClient } from '../prisma/generated/client/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function generateToken() {
    try {
        console.log('\n🔒 Генерируем секретный токен для одноразового входа...\n');
        const token = crypto.randomBytes(32).toString('hex');

        // Создаем токен на 1 час
        await prisma.authToken.create({
            data: {
                token,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            }
        });

        const loginUrl = `http://localhost:3000/login?token=${token}`;

        // Пытаемся скопировать в буфер обмена
        try {
            if (process.platform === 'win32') {
                execSync(`echo ${loginUrl} | clip`);
            } else if (process.platform === 'darwin') {
                execSync(`echo "${loginUrl}" | pbcopy`);
            } else {
                execSync(`echo "${loginUrl}" | xclip -selection clipboard`);
            }
            console.log('✅ Ссылка успешно скопирована в буфер обмена!');
        } catch (e) {
            console.log('⚠️ Не удалось скопировать в буфер обмена (возможно нет прав).');
        }

        console.log('\n🔗 Ваша одноразовая ссылка для входа:');
        console.log(`   \x1b[36m${loginUrl}\x1b[0m\n`);
        console.log('Просто вставьте её в браузер. Токен действителен 1 час или до первого использования.');
    } catch (error) {
        console.error('Ошибка при генерации токена:', error);
    } finally {
        await prisma.$disconnect();
    }
}

generateToken();

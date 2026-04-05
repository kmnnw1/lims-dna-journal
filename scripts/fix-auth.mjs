import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Используем библиотеку шифрования

const prisma = new PrismaClient();

async function main() {
  console.log('Шифруем пароль...');
  // Превращаем 'admin' в зашифрованный хеш
  const hashedPassword = await bcrypt.hash('admin', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword }, // Обновляем пароль у существующего юзера!
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Успех! Зашифрованный админ готов:', admin.username);
}

main()
  .catch((e) => {
    console.error('Ошибка скрипта:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

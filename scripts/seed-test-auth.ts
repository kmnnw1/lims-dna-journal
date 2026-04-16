import { PrismaClient } from '../prisma/generated/client/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding test auth token and specimens...');

    // 1. Clear potentially broken tokens
    await prisma.authToken.deleteMany({ where: { token: 'test-token-123' } });

    // 2. Add the token used in Playwright tests
    await prisma.authToken.create({
        data: {
            token: 'test-token-123',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
        }
    });

    // 3. Add some sample data if the table is empty
    const count = await prisma.specimen.count();
    if (count === 0) {
        await prisma.specimen.create({
            data: {
                id: 'AP1932',
                taxon: 'Amanita muscaria',
                locality: 'Moscow Region',
                dnaConcentration: 45.5,
                itsStatus: '✓',
            }
        });
        await prisma.specimen.create({
            data: {
                id: 'AP1933',
                taxon: 'Boletus edulis',
                locality: 'Saint-Petersburg',
                dnaConcentration: 12.2,
                itsStatus: '✕',
            }
        });
    }

    console.log('✅ Done!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

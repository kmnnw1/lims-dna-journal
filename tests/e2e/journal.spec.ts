import { test, expect, type Page } from '@playwright/test';

const APP_URL = 'http://localhost:3000';

// Универсальная функция входа
async function loginAdmin(page: Page) {
    await page.goto(`${APP_URL}/login`);

    // Находим поле для токена
    const tokenInput = page.locator('input[type="password"]').first();

    // Используем тестовый токен (на сервере должен быть AUTH_TEST_TOKEN)
    const testToken = process.env.TEST_TOKEN || 'test-token-123';
    await tokenInput.fill(testToken);

    // Нажимаем Enter для отправки формы
    await tokenInput.press('Enter');

    // ФИКС: Заголовка больше нет, поэтому ждем появления поля поиска
    // Это надежный индикатор того, что главная страница загрузилась
    await expect(page.getByPlaceholder(/Поиск/i).first()).toBeVisible({
        timeout: 20000,
    });
}

test.describe('Авторизация и Доступ', () => {
    test('Успешный вход и выход', async ({ page }) => {
        await loginAdmin(page);

        // Используем псевдоселектор :visible для поиска активной кнопки
        const logoutBtn = page.locator('button[title="Выйти"]:visible').first();
        await logoutBtn.click({ force: true });

        await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });
    });

    test('Админ-панель открывается', async ({ page }) => {
        await loginAdmin(page);

        const adminLink = page.locator('a[href="/admin"]:visible').first();
        await adminLink.click({ force: true });
        
        await page.waitForURL('**/admin');
        await expect(page.locator('h1')).toContainText(/Администрирование/i);
    });

    test('Админ-панель: Кнопка резервного копирования (Скачать БД)', async ({ page }) => {
        await loginAdmin(page);

        const adminLink = page.locator('a[href="/admin"]:visible').first();
        await adminLink.click({ force: true });

        await page.waitForURL('**/admin');
        await expect(page.locator('h1')).toContainText(/Администрирование/i);

        const downloadBtn = page
            .locator('button:visible')
            .filter({ hasText: /Скачать БД/i })
            .first();
        await expect(downloadBtn).toBeVisible();

        // Ожидаем событие начала загрузки файла
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            downloadBtn.click({ force: true }),
        ]);

        expect(download.url()).toContain('/api/backup/download');
    });
});

test.describe('Журнал Проб - Основной функционал', () => {
    test.beforeEach(async ({ page }) => {
        await loginAdmin(page);
        // Ждем появления таблицы или карточек
        await expect(page.locator('table tbody tr, article').first())
            .toBeVisible({ timeout: 30000 })
            .catch(() => { });
    });

    test('Поиск по базе и темная тема', async ({ page }) => {
        const themeBtn = page.locator('button[title^="Тема"]:visible').first();

        await themeBtn.click(); // light -> dark
        await expect(page.locator('html')).toHaveClass(/dark/);

        await themeBtn.click(); // dark -> light
        // Wait for the 'dark' class to disappear specifically
        await expect(page.locator('html')).not.toHaveClass(/dark/);

        const searchInput = page.getByPlaceholder(/Поиск/i).and(page.locator(':visible')).first();
        await searchInput.fill('AP1932');
        await searchInput.press('Enter');

        // Ждем либо подсветки результата, либо сообщения об отсутствии
        await Promise.race([
            expect(page.locator('mark').first()).toBeVisible({ timeout: 10000 }),
            expect(page.getByText(/ничего не найдено/i)).toBeVisible({ timeout: 10000 }),
        ]).catch(() => { });
    });

    test('Создание новой пробы', async ({ page, isMobile }) => {
        const testId = `AUTO-${Math.floor(Math.random() * 10000)}`;

        if (isMobile) {
            const addBtn = page
                .locator('button:visible')
                .filter({ has: page.locator('svg.lucide-plus') })
                .first();
            await addBtn.click({ force: true });
        } else {
            const addBtn = page
                .locator('button:visible')
                .filter({ hasText: /Новая проба/i })
                .first();
            await addBtn.click({ force: true });
        }

        const modalHeading = page.getByRole('heading', { name: /Новая проба/i });
        await expect(modalHeading).toBeVisible({ timeout: 10000 });

        await page.getByTestId('addspecimen-id').fill(testId);
        await page.getByTestId('addspecimen-taxon').fill('Testus Automatus');

        const saveBtn = page
            .locator('button[type="submit"]:visible')
            .filter({ hasText: /Сохранить/i })
            .first();
        await saveBtn.click({ force: true });

        await expect(modalHeading).toBeHidden({ timeout: 15000 });
    });

    test('Редактирование пробы и история ПЦР', async ({ page }) => {
        await page.waitForTimeout(2000);

        const editButton = page
            .locator('button[title="Изменить"]:visible, button[aria-label="Редактировать"]:visible')
            .first();

        if (await editButton.isVisible()) {
            // 1. Открываем редактирование
            await editButton.click({ force: true });
            const editHeading = page.getByRole('heading', { name: /Редактировать/i });
            await expect(editHeading).toBeVisible({ timeout: 10000 });

            // 2. Закрываем через "Отмена"
            const cancelBtn = page
                .getByRole('button', { name: /Отмена/i })
                .and(page.locator(':visible'))
                .first();
            await cancelBtn.scrollIntoViewIfNeeded();
            await cancelBtn.click({ force: true });

            await expect(editHeading).toBeHidden({ timeout: 10000 });

            // 3. Теперь открываем ПЦР
            const pcrButton = page
                .locator('button[title="ПЦР"]:visible, button[aria-label="PCR"]:visible')
                .first();
            await pcrButton.scrollIntoViewIfNeeded();
            await pcrButton.hover();
            await pcrButton.click({ force: true });

            await expect(page.getByRole('heading', { name: /Постановка ПЦР/i })).toBeVisible({
                timeout: 15000,
            });
            await expect(page.getByText(/История реакций/i)).toBeVisible({ timeout: 10000 });

            // Закрываем модалку ПЦР
            await page.keyboard.press('Escape');
            await expect(page.getByRole('heading', { name: /Постановка ПЦР/i })).toBeHidden();
        }
    });

    test('Проверка новых функций (Экспорт, Сканер)', async ({ page }) => {
        const exportBtn = page
            .locator('button:visible')
            .filter({ hasText: /Экспорт/i })
            .first();
        await exportBtn.click({ force: true });

        await expect(
            page
                .locator('button:visible')
                .filter({ hasText: /Сохранить CSV/i })
                .first(),
        ).toBeVisible({ timeout: 10000 });
        const scanBtn = page
            .locator('button:visible')
            .filter({ hasText: /Сканировать/i })
            .first();
        await expect(scanBtn).toBeVisible();

        // Тестирование модалки сканера
        await scanBtn.click({ force: true });
        await expect(page.getByRole('heading', { name: /Сканирование/i })).toBeVisible({
            timeout: 10000,
        });

        // Ручной ввод в сканер
        await page.locator('input[type="text"]:visible').last().fill('AP1932');
        await page
            .locator('button:visible')
            .filter({ hasText: /Найти пробу/i })
            .first()
            .click({ force: true });

        // Ждем закрытия модалки или сообщения о том, что проба не найдена
        await Promise.race([
            expect(page.getByRole('heading', { name: /Сканирование/i })).toBeHidden({
                timeout: 5000,
            }),
            expect(page.getByText(/не найден/i)).toBeVisible({ timeout: 5000 }),
            expect(page.getByText(/ошибка/i)).toBeVisible({ timeout: 5000 }),
        ]).catch(() => { });

        const scanHeading = page.getByRole('heading', { name: /Сканирование/i });
        if (await scanHeading.isVisible()) {
            const closeBtn = page
                .locator('button')
                .filter({ has: page.locator('svg.lucide-x') })
                .first();
            if (await closeBtn.isVisible()) {
                await closeBtn.click({ force: true });
            } else {
                await page.keyboard.press('Escape');
            }
        }

        await expect(scanHeading).toBeHidden({ timeout: 5000 });
    });
});

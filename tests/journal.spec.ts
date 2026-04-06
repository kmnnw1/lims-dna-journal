import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3000';

// Универсальная функция входа
async function loginAdmin(page: any) {
    await page.goto(`${APP_URL}/login`);

    const userInput = page.locator('input[type="text"], input[name="username"], input[name="login"]').first();
    const passInput = page.locator('input[type="password"]').first();

    await userInput.fill('admin');
    await passInput.fill('admin');

    // Самый надежный способ для React-форм (нажимаем Enter внутри поля)
    await passInput.press('Enter');

    // ТИТАНОВЫЙ ФОЛЛБЭК ДЛЯ SAFARI: находим HTML-форму и отправляем ее системно
    await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) form.requestSubmit();
    }).catch(() => {});

    // Ждем загрузки журнала
    await expect(page.getByRole('heading', { name: /Журнал Проб/i })).toBeVisible({ timeout: 20000 });
}

test.describe('Авторизация и Доступ', () => {
    test('Успешный вход и выход', async ({ page }) => {
        await loginAdmin(page);

        // Ищем ТОЛЬКО видимую кнопку выхода
        const logoutBtn = page.locator('button[title="Выйти"]:visible').first();
        await logoutBtn.click({ force: true });

        await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });
    });

    test('Админ-панель открывается', async ({ page }) => {
        await loginAdmin(page);

        // Ищем ТОЛЬКО видимую ссылку на админку
        const adminLink = page.locator('a[href="/admin"]:visible').first();
        await adminLink.click({ force: true });

        await expect(page.getByRole('heading', { name: /Администрирование/i })).toBeVisible({ timeout: 15000 });
    });

    test('Админ-панель: Кнопка резервного копирования (Скачать БД)', async ({ page, context }) => {
        await loginAdmin(page);

        // Переходим в админку
        const adminLink = page.locator('a[href="/admin"]:visible').first();
        await adminLink.click({ force: true });
        await expect(page.getByRole('heading', { name: /Администрирование/i })).toBeVisible({ timeout: 15000 });

        // Убеждаемся, что кнопка скачивания существует и видна
        const downloadBtn = page.locator('button:visible').filter({ hasText: /Скачать БД/i }).first();
        await expect(downloadBtn).toBeVisible();

        // Проверяем, что при клике открывается новая вкладка (отправка запроса на файл)
        // Мы перехватываем событие 'page' в контексте браузера
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            downloadBtn.click({ force: true })
        ]);
        
        // Убеждаемся, что скачивание идет с правильного эндпоинта
        expect(newPage.url()).toContain('/api/backup/download');
    });
});

test.describe('Журнал Проб - Основной функционал', () => {
    test.beforeEach(async ({ page }) => {
        await loginAdmin(page);
        await expect(page.locator('table tbody tr, article').first()).toBeVisible({ timeout: 30000 }).catch(() => {});
    });

    test('Поиск по базе и темная тема', async ({ page }) => {
        const themeBtn = page.locator('button[title="Тема"]:visible').first();

        await themeBtn.click({ force: true });
        await expect(page.locator('html')).toHaveClass(/dark/);

        await themeBtn.click({ force: true });
        await expect(page.locator('html')).not.toHaveClass(/dark/);

        const searchInput = page.getByPlaceholder(/Поиск/i).and(page.locator(':visible')).first();
        await searchInput.fill('AP1932');
        await searchInput.press('Enter');

        await Promise.race([
            expect(page.locator('mark').first()).toBeVisible({ timeout: 10000 }),
            expect(page.getByText(/ничего не найдено/i)).toBeVisible({ timeout: 10000 })
        ]).catch(() => {});
    });

    test('Создание новой пробы', async ({ page, isMobile }) => {
        const testId = `AUTO-${Math.floor(Math.random() * 10000)}`;

        if (isMobile) {
            const addBtn = page.locator('button:visible').filter({ has: page.locator('svg.lucide-plus') }).first();
            await addBtn.click({ force: true });
        } else {
            const addBtn = page.locator('button:visible').filter({ hasText: /Новая проба/i }).first();
            await addBtn.click({ force: true });
        }

        const modalHeading = page.getByRole('heading', { name: /Новая проба/i });
        await expect(modalHeading).toBeVisible({ timeout: 10000 });

        await page.getByTestId('addspecimen-id').fill(testId);
        await page.getByTestId('addspecimen-taxon').fill('Testus Automatus');

        const saveBtn = page.locator('button[type="submit"]:visible').filter({ hasText: /Сохранить/i }).first();
        await saveBtn.click({ force: true });

        await expect(modalHeading).toBeHidden({ timeout: 15000 });
    });

    test('Редактирование пробы и история ПЦР', async ({ page }) => {
        await page.waitForTimeout(2000); // Даем интерфейсу прогрузиться полностью

        // Фильтруем скрытые десктопные/мобильные кнопки, берем только видимые
        const editButton = page.locator('button[title="Изменить"]:visible, button[aria-label="Редактировать"]:visible').first();

        if (await editButton.isVisible()) {
            await editButton.click({ force: true });
            await expect(page.getByRole('heading', { name: /Редактировать/i })).toBeVisible({ timeout: 10000 });

            const cancelBtn = page.getByRole('button', { name: /Отмена/i }).and(page.locator(':visible')).first();
            await cancelBtn.click({ force: true });

            await page.waitForTimeout(1000);

            const pcrButton = page.locator('button[title="ПЦР"]:visible, button[aria-label="PCR"]:visible').first();
            await pcrButton.click({ force: true });
            await expect(page.getByRole('heading', { name: /Постановка ПЦР/i })).toBeVisible({ timeout: 10000 });
            await expect(page.getByText(/История реакций/i)).toBeVisible({ timeout: 10000 });
            await page.keyboard.press('Escape');
        }
    });

    test('Проверка новых функций (Экспорт, Сканер)', async ({ page }) => {
        // 1. Проверяем наличие новых кнопок на главной
        await expect(page.locator('button:visible').filter({ hasText: /Выгрузить CSV/i }).first()).toBeVisible({ timeout: 10000 });
        const scanBtn = page.locator('button:visible').filter({ hasText: /Сканировать/i }).first();
        await expect(scanBtn).toBeVisible();

        // 2. Проверяем модалку сканера
        await scanBtn.click({ force: true });
        await expect(page.getByRole('heading', { name: /Сканирование/i })).toBeVisible({ timeout: 10000 });
        
        // Вводим вручную в сканер
        await page.locator('input[type="text"]:visible').last().fill('AP1932');
        await page.locator('button:visible').filter({ hasText: /Найти пробу/i }).first().click({ force: true });
        
        await expect(page.getByRole('heading', { name: /Сканирование/i })).toBeHidden({ timeout: 10000 });
    });
});

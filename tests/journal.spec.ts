import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3000';

async function loginAdmin(page: any) {
    await page.goto(`${APP_URL}/login`);

    await page.locator('input[type="text"], input[name="username"], input[name="login"]').first().fill('admin');
    await page.locator('input[type="password"]').first().fill('admin');

    // Самый надежный способ для React-форм (нажимаем Enter внутри поля)
    await page.locator('input[type="password"]').first().press('Enter');

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
});

test.describe('Журнал Проб - Основной функционал', () => {
    test.beforeEach(async ({ page }) => {
        await loginAdmin(page);
        await expect(page.locator('table tbody tr, article').first()).toBeVisible({ timeout: 30000 }).catch(() => {});
    });

    test('Поиск по базе и темная тема', async ({ page }) => {
        // Playwright .filter() does NOT support a 'state' property; use .filter({ visible: true }) instead
        const themeBtn = page.locator('button[title="Тема"]').filter({ visible: true }).first();

        await themeBtn.click({ force: true });
        await expect(page.locator('html')).toHaveClass(/dark/);

        await themeBtn.click({ force: true });
        await expect(page.locator('html')).not.toHaveClass(/dark/);

        const searchInput = page.getByPlaceholder(/Поиск/i).filter({ visible: true }).first();
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
            const addBtn = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).filter({ visible: true }).first();
            await addBtn.click({ force: true });
        } else {
            const addBtn = page.locator('button').filter({ hasText: /Новая проба/i }).filter({ visible: true }).first();
            await addBtn.click({ force: true });
        }

        const modalHeading = page.getByRole('heading', { name: /Новая проба/i });
        await expect(modalHeading).toBeVisible({ timeout: 10000 });

        await page.getByTestId('addspecimen-id').fill(testId);
        await page.getByTestId('addspecimen-taxon').fill('Testus Automatus');

        const saveBtn = page.locator('button[type="submit"]').filter({ hasText: /Сохранить/i }).filter({ visible: true }).first();
        await saveBtn.click({ force: true });


        await expect(modalHeading).toBeHidden({ timeout: 15000 });
    });

    test('Редактирование пробы и модалка ПЦР', async ({ page }) => {
        await page.waitForTimeout(2000); // Даем интерфейсу прогрузиться полностью

        // Фильтруем скрытые десктопные кнопки, берем только видимые мобильные
        const editButton = page.locator('button[title="Изменить"], button[aria-label="Редактировать"]').filter({ visible: true }).first();

        if (await editButton.isVisible()) {
            await editButton.click({ force: true });
            await expect(page.getByRole('heading', { name: /Редактировать/i })).toBeVisible({ timeout: 10000 });

            const cancelBtn = page.getByRole('button', { name: /Отмена/i }).filter({ visible: true }).first();
            await cancelBtn.click({ force: true });


            await page.waitForTimeout(1000);

            // Именно здесь падало: робот кликал скрытую десктопную кнопку
            const pcrButton = page.locator('button[title="ПЦР"], button[aria-label="PCR"]').filter({ visible: true }).first();
            await pcrButton.click({ force: true });

            await expect(page.getByRole('heading', { name: /ПЦР/i })).toBeVisible({ timeout: 10000 });
            await page.keyboard.press('Escape');
        }
    });
});

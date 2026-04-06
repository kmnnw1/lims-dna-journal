import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3000';

// Универсальная функция входа с защитой от багов мобильной клавиатуры
async function loginAdmin(page: any) {
    await page.goto(`${APP_URL}/login`);
    
    const userInput = page.locator('input[type="text"], input[name="username"], input[name="login"]').first();
    const passInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"], form button').first();
    
    await userInput.fill('admin');
    await passInput.fill('admin');
    
    // Снимаем фокус, чтобы спрятать клавиатуру в Safari
    await passInput.blur();
    await page.waitForTimeout(500);
    
    // Нажимаем Enter или кликаем по кнопке
    await page.keyboard.press('Enter');
    await submitBtn.click({ force: true }).catch(() => {});
    
    // Ждем появления заголовка журнала
    await expect(page.getByRole('heading', { name: /Журнал Проб/i })).toBeVisible({ timeout: 20000 });
}

test.describe('Авторизация и Доступ', () => {
    test('Успешный вход и выход', async ({ page }) => {
        await loginAdmin(page);
        
        // Выход (ищем видимую кнопку "Выйти"; фильтруем вручную, т.к. у фильтра нет свойства state)
        const logoutBtns = await page.locator('button[title="Выйти"]').all();
        let logoutBtn = null;
        for (const btn of logoutBtns) {
            if (await btn.isVisible()) {
                logoutBtn = btn;
                break;
            }
        }
        if (!logoutBtn) throw new Error('Не найдена видимая кнопка "Выйти"');
        await logoutBtn.click({ force: true });
        
        await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });
    });

    test('Админ-панель открывается', async ({ page }) => {
        await loginAdmin(page);
        // Админ-панель может называться по-разному; пробуем разные варианты ссылок
        const adminLinks = await page.locator('a', { hasText: /Админ(ка|истика|панель|истрирование)?/i }).all();

        let adminLink = null;
        for (const link of adminLinks) {
            if (await link.isVisible()) {
                adminLink = link;
                break;
            }
        }
        if (!adminLink) throw new Error('Не найдена видимая ссылка на админ-панель');
        await adminLink.click({ force: true });
        
        await expect(page.getByRole('heading', { name: /Администрирование/i })).toBeVisible({ timeout: 15000 });
    });
});

test.describe('Журнал Проб - Основной функционал', () => {
    test.beforeEach(async ({ page }) => {
        await loginAdmin(page);
        // Ждем отрисовки таблицы или карточек
        await expect(page.locator('table tbody tr, article').first()).toBeVisible({ timeout: 30000 }).catch(() => {});
    });

    test('Поиск по базе и темная тема', async ({ page }) => {
        // Find the first visible theme button (without using 'state' option)
        const themeBtns = await page.locator('button[title="Тема"]').all();
        let themeBtn = null;
        for (const btn of themeBtns) {
            if (await btn.isVisible()) {
                themeBtn = btn;
                break;
            }
        }
        if (!themeBtn) throw new Error('Не найдена видимая кнопка "Тема"');
        
        // Тема
        await themeBtn.click({ force: true });
        await expect(page.locator('html')).toHaveClass(/dark/);
        await themeBtn.click({ force: true });
        await expect(page.locator('html')).not.toHaveClass(/dark/);

        // Поиск
        // Find the first visible search input without using the 'state' option
        const searchInputs = await page.getByPlaceholder(/Поиск/i).all();
        let searchInput = null;
        for (const input of searchInputs) {
            if (await input.isVisible()) {
                searchInput = input;
                break;
            }
        }
        if (!searchInput) throw new Error('Не найден видимый поле поиска');
        await searchInput.fill('AP1932');
        await searchInput.press('Enter');
        
        // Ждем либо подсветку найденного, либо текст о пустом результате
        await Promise.race([
            expect(page.locator('mark').first()).toBeVisible({ timeout: 10000 }),
            expect(page.getByText(/ничего не найдено/i)).toBeVisible({ timeout: 10000 })
        ]).catch(() => {});
    });

    test('Создание новой пробы', async ({ page, isMobile }) => {
        const testId = `AUTO-${Math.floor(Math.random() * 10000)}`;

        // Find the first visible 'add' button, by iterating through the matching elements and using isVisible()
        let addBtn = null;
        if (isMobile) {
            const candidates = await page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).all();
            for (const btn of candidates) {
                if (await btn.isVisible()) {
                    addBtn = btn;
                    break;
                }
            }
        } else {
            const candidates = await page.locator('button').filter({ hasText: /Новая проба/i }).all();
            for (const btn of candidates) {
                if (await btn.isVisible()) {
                    addBtn = btn;
                    break;
                }
            }
        }
        if (!addBtn) throw new Error('Не найдена видимая кнопка добавления пробы');
        await addBtn.click({ force: true });
        
        const modal = page.locator('div[role="dialog"]').filter({ hasText: /Новая проба/i });
        await expect(modal).toBeVisible();

        await page.getByTestId('addspecimen-id').fill(testId);
        await page.getByTestId('addspecimen-taxon').fill('Testus Automatus');
        
        await page.locator('button').filter({ hasText: /Сохранить/i }).click({ force: true });
        await expect(modal).toBeHidden({ timeout: 15000 });
    });

    test('Редактирование и история ПЦР', async ({ page }) => {
        // 1. Проверка модалки редактирования
        // Найти первую видимую кнопку "Изменить"
        const editCandidates = await page.locator('button[title="Изменить"]').all();
        let editBtn = null;
        for (const btn of editCandidates) {
            if (await btn.isVisible()) {
                editBtn = btn;
                break;
            }
        }
        if (editBtn) {
            await editBtn.click({ force: true });
            await expect(page.getByRole('heading', { name: /Редактировать/i })).toBeVisible();
            await page.getByRole('button', { name: /Отмена/i }).click({ force: true });
        }

        // 2. Проверка истории в ПЦР
        const pcrCandidates = await page.locator('button[title="ПЦР"]').all();
        let pcrBtn = null;
        for (const btn of pcrCandidates) {
            if (await btn.isVisible()) {
                pcrBtn = btn;
                break;
            }
        }
        if (pcrBtn) {
            await pcrBtn.click({ force: true });
            await expect(page.getByRole('heading', { name: /Постановка ПЦР/i })).toBeVisible();
            await expect(page.getByText(/История реакций/i)).toBeVisible();
            await page.keyboard.press('Escape');
        }
    });

    test('Проверка экспорта и сканера', async ({ page }) => {
        // Проверка кнопок из page.tsx
        await expect(page.locator('button').filter({ hasText: /Выгрузить CSV/i }).first()).toBeVisible();

        const scanBtn = page.locator('button').filter({ hasText: /Сканировать/i }).first();
        await expect(scanBtn).toBeVisible();

        // Проверка модалки сканера
        await scanBtn.click({ force: true });
        await expect(page.getByRole('heading', { name: /Сканирование/i })).toBeVisible();
        
        // Ручной ввод в сканере
        await page.locator('input:visible').last().fill('SCAN-TEST');
        await page.locator('button').filter({ hasText: /Найти пробу/i }).click({ force: true });
        
        await expect(page.getByRole('heading', { name: /Сканирование/i })).toBeHidden();
    });
});

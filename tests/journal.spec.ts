import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3000';

// Увеличиваем глобальный таймаут для тестов в CI, так как облако медленнее
test.setTimeout(process.env.CI ? 60000 : 30000); 

test.describe('База Проб - Полный цикл', () => {

	test.beforeEach(async ({ page }) => {
		await page.goto(APP_URL);
		const loginButton = page.locator('button', { hasText: /войти/i });
		
		if (await loginButton.isVisible()) {
			await page.locator('input[type="text"]').fill('admin');
			await page.locator('input[type="password"]').fill('admin');
			await loginButton.click();
			
			// Ждем появления заголовка. В CI даем до 30 секунд.
			await expect(page.getByRole('heading', { name: 'База Проб' })).toBeVisible({ timeout: 30000 });
		}
	});

	test('1. Поиск по базе', async ({ page }) => {
		await page.goto(APP_URL);
		
		// Сначала убеждаемся, что таблица загрузилась и в ней есть хотя бы одна строка
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 30000 });
		
		const searchInput = page.locator('#main-search');
		await searchInput.fill('AP1932'); 
		
		// В облаке фильтрация 5000 строк может занять время, даем маркерам до 15 секунд
		await expect(page.locator('mark').first()).toBeVisible({ timeout: 15000 });
	});

	test('2. Создание новой пробы', async ({ page }) => {
		await page.goto(APP_URL);
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 30000 });
		
		const testId = `AUTO-${Math.floor(Math.random() * 10000)}`;

		await page.getByRole('button', { name: /новая проба/i }).click();
		
		const modal = page.locator('div[role="dialog"]').first();
		await expect(modal).toBeVisible();

		await modal.getByPlaceholder(/id пробы/i).fill(testId);
		await modal.locator('[data-testid="addspecimen-taxon"]').fill('Testus Automatus');
		
		await modal.getByRole('button', { name: /сохранить/i }).click();

		await expect(page.locator('text=Проба добавлена')).toBeVisible({ timeout: 15000 });
	});

	test('3. Редактирование пробы', async ({ page }) => {
		await page.goto(APP_URL);
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 30000 });

		const editButton = page.locator('button[title="Изменить"]').first();
		await editButton.click();

		await expect(page.getByRole('heading', { name: /Редактировать/i })).toBeVisible();
		
		const taxonInput = page.getByRole('textbox', { name: /Таксон/i });
		await taxonInput.fill(`Edited-${Date.now()}`);

		await page.getByRole('button', { name: /сохранить/i }).click();
		
		await expect(page.locator('text=Проба успешно обновлена')).toBeVisible({ timeout: 15000 });
	});

	test('4. Массовые операции', async ({ page }) => {
		await page.goto(APP_URL);
		
		// Очень важно дождаться загрузки строк перед тем, как искать чекбоксы
		await expect(page.locator('table tbody tr').nth(2)).toBeVisible({ timeout: 30000 });

		const checkboxes = page.locator('table tbody input[type="checkbox"]');
		await checkboxes.nth(1).check();
		await checkboxes.nth(2).check();

		const selectionBar = page.locator('div.sticky.\\!bg-teal-50');
		await expect(selectionBar).toBeVisible();

		await selectionBar.locator('input[name="massLab"]').fill('Batch Lab');
		await selectionBar.getByRole('button', { name: /применить ко всем/i }).click();

		await expect(page.locator('text=Данные обновлены')).toBeVisible({ timeout: 15000 });
	});
});

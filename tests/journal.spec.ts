import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3000';

test.setTimeout(process.env.CI ? 60000 : 30000); 

test.describe('База Проб - Полный цикл', () => {

	test.beforeEach(async ({ page }) => {
		await page.goto(APP_URL);
		const loginButton = page.locator('button', { hasText: /войти/i });
		
		if (await loginButton.isVisible()) {
			await page.locator('input[type="text"]').fill('admin');
			await page.locator('input[type="password"]').fill('admin');
			await loginButton.click();
			await expect(page.getByRole('heading', { name: 'База Проб' })).toBeVisible({ timeout: 30000 });
		}
	});

	test('1. Поиск по базе', async ({ page }) => {
		await page.goto(APP_URL);
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 30000 });
		
		const searchInput = page.locator('#main-search');
		await searchInput.fill('AP1932'); 
		await expect(page.locator('mark').first()).toBeVisible({ timeout: 15000 });
	});

	test('2. Создание новой пробы', async ({ page }) => {
		await page.goto(APP_URL);
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 30000 });
		
		const testId = `AUTO-${Math.floor(Math.random() * 10000)}`;

		await page.getByRole('button', { name: /новая проба/i }).click();
		
		const modal = page.locator('div[role="dialog"]').first();
		await expect(modal).toBeVisible();

		// ИСПРАВЛЕНИЕ: Ищем по новому placeholder или атрибуту name
		await modal.locator('input[name="id"]').fill(testId);
		await modal.locator('input[name="taxon"]').fill('Testus Automatus');
		
		await modal.getByRole('button', { name: /сохранить/i }).click();
		
		// Поскольку у нас пока нет toast-уведомлений в новом page.tsx, 
		// просто проверяем, что модалка закрылась
		await expect(modal).toBeHidden({ timeout: 15000 });
	});

	test('3. Редактирование пробы', async ({ page }) => {
		await page.goto(APP_URL);
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 30000 });

		const editButton = page.locator('button[title="Изменить"]').first();
		await editButton.click();

		const modal = page.locator('div[role="dialog"]').first();
		await expect(modal).toBeVisible();
		
		// ИСПРАВЛЕНИЕ: Ищем поле именно внутри модалки, чтобы избежать конфликта с главным поиском
		const taxonInput = modal.locator('input[name="taxon"]');
		await taxonInput.fill(`Edited-${Date.now()}`);

		await modal.getByRole('button', { name: /сохранить/i }).click();
		await expect(modal).toBeHidden({ timeout: 15000 });
	});

	test('4. Массовые операции', async ({ page }) => {
		await page.goto(APP_URL);
		await expect(page.locator('table tbody tr').nth(1)).toBeVisible({ timeout: 30000 });

		const checkboxes = page.locator('table tbody input[type="checkbox"]');
		await checkboxes.nth(1).check();

		// ИСПРАВЛЕНИЕ: Ждем появления нашей панели (которую мы сейчас добавим)
		const selectionBar = page.locator('div.sticky');
		await expect(selectionBar).toBeVisible();
	});
});

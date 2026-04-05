import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3000';

test.setTimeout(process.env.CI ? 60000 : 30000); 

test.describe('База Проб - Полный цикл (MD3 UI)', () => {

	test.beforeEach(async ({ page }) => {
		await page.goto(APP_URL);
		
		// Обновленный поиск кнопки входа по тексту или атрибутам
		const loginButton = page.locator('button', { hasText: /войти/i });
		
		if (await loginButton.isVisible()) {
			// На странице логина теперь плавающие лейблы, но селекторы по типу работают
			await page.locator('input[type="text"]').fill('admin');
			await page.locator('input[type="password"]').fill('admin');
			await loginButton.click();
			
			// Ждем появления главной страницы
			await expect(page.getByRole('heading', { name: 'Журнал Проб' })).toBeVisible({ timeout: 30000 });
		}
	});

	test('1. Поиск по базе', async ({ page }) => {
		await page.goto(APP_URL);
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 30000 });
		
		// MD3 Search Input теперь использует placeholder "Поиск по ID или таксону..."
		const searchInput = page.getByPlaceholder('Поиск по ID или таксону...');
		await searchInput.fill('AP1932'); 
		
		// Ждем подсветку (теперь она в MD3 Tertiary Container)
		await expect(page.locator('mark').first()).toBeVisible({ timeout: 15000 });
	});

	test('2. Создание новой пробы', async ({ page }) => {
		await page.goto(APP_URL);
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 30000 });
		
		const testId = `AUTO-${Math.floor(Math.random() * 10000)}`;

		// Клик по FAB кнопке
		await page.getByRole('button', { name: /новая проба/i }).click();
		
		const modal = page.locator('div[role="dialog"]').first();
		await expect(modal).toBeVisible();

		// В MD3Field мы можем найти поля по data-testid (если они остались) или через label
		// Мы сохраняли data-testid в AddSpecimenModal.tsx
		await modal.getByTestId('addspecimen-id').fill(testId);
		await modal.getByTestId('addspecimen-taxon').fill('Testus Automatus (MD3)');
		
		await modal.getByTestId('addspecimen-submit').click();
		
		// Проверяем, что модалка закрылась
		await expect(modal).toBeHidden({ timeout: 15000 });
	});

	test('3. Редактирование пробы', async ({ page }) => {
		await page.goto(APP_URL);
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 30000 });

		// Кнопка редактирования (теперь это Tonal Icon Button)
		const editButton = page.locator('button[title="Изменить"]').first();
		await editButton.click();

		const modal = page.locator('div[role="dialog"]').first();
		await expect(modal).toBeVisible();
		
		// Ищем поле "Таксон" (оно теперь внутри MD3Field, можно искать по значению лейбла, если testid удален)
		// В нашем EditSpecimenModal мы убрали testid, но оставили label.
		const taxonInput = modal.locator('input').nth(0); // Таксон - первое поле
		await taxonInput.fill(`Edited-MD3-${Date.now()}`);

		await modal.getByRole('button', { name: /сохранить/i }).click();
		await expect(modal).toBeHidden({ timeout: 15000 });
	});

	test('4. Массовые операции', async ({ page }) => {
		await page.goto(APP_URL);
		await expect(page.locator('table tbody tr').nth(1)).toBeVisible({ timeout: 30000 });

		// Чекбоксы теперь стилизованы под MD3, но это все еще input[type="checkbox"]
		const checkboxes = page.locator('table tbody input[type="checkbox"]');
		await checkboxes.nth(1).check();

		// Ждем появления MD3 Bottom App Bar
		// Он имеет текст "выбрано" и кнопку "Действия"
		const selectionBar = page.getByText(/выбрано/i).locator('..'); 
		await expect(selectionBar).toBeVisible();
	});
});

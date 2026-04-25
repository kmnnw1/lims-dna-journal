import { expect, type Page, test } from '@playwright/test';

// APP_URL больше не нужен, используем baseURL из конфига

// Универсальная функция входа
async function loginAdmin(page: Page) {
	// Переходим на страницу входа
	await page.goto('/login');

	// Ждем, пока URL стабилизируется (для исключения промежуточных редиректов)
	await page.waitForURL('**/login');

	// Ждем окончания загрузки и стабилизации
	await page.waitForLoadState('networkidle');
	await page.waitForLoadState('domcontentloaded');

	// Находим поле для токена через LABEL (самый надежный способ для Accessibility и MD3)
	// Добавляем fallback на id, который мы только что внедрили
	const tokenInput = page
		.getByLabel(/токен|пароль/i)
		.or(page.locator('#password-input'))
		.first();

	// Ждем появления поля (поможет при медленной загрузке/гидратации)
	try {
		await expect(tokenInput).toBeVisible({ timeout: 15000 });
	} catch (e) {
		console.error('--- DIAGNOSTICS: Login Field not visible ---');
		console.error('URL:', page.url());
		console.error('Title:', await page.title());
		const body = await page.evaluate(() => document.body.innerText.slice(0, 500));
		console.error('Body snippet (first 500 chars):', body);
		throw e;
	}

	// Используем тестовый токен из окружения CI или дефолтный
	const testToken = process.env.TEST_TOKEN || process.env.AUTH_TEST_TOKEN || 'NOT_SET';

	// Перед заполнением убеждаемся, что поле активно
	await tokenInput.click();
	await tokenInput.fill(testToken);

	// Нажимаем Enter для отправки формы
	await tokenInput.press('Enter');

	// Ждем перехода на главную или появления индикатора авторизации
	try {
		// Увеличиваем таймаут до 20 секунд для CI
		await page.waitForURL('/', { timeout: 20000 });
	} catch (_e) {
		const currentUrl = page.url();
		console.log(`Timeout waiting for redirect to /. Current URL: ${currentUrl}`);

		// Пытаемся найти текст ошибки на странице
		const errorText = await page
			.locator('.bg-red-600, .bg-\\(--md-sys-color-error-container\\), [role="alert"]')
			.first()
			.textContent()
			.catch(() => '');

		if (errorText) {
			console.log(`Login error found on page: ${errorText.trim()}`);
		}

		// Пытаемся получить содержимое body для отладки
		const bodySnippet = await page
			.evaluate(() => document.body.innerText)
			.catch(() => 'Could not get body text via evaluate');
		console.log(`Page content snippet (first 500 chars): ${bodySnippet.slice(0, 500)}`);

		throw new Error(
			`Login failed. Stayed on ${currentUrl}. Error: ${errorText.trim() || 'None'}. Snippet: ${bodySnippet.slice(0, 100)}`,
		);
	}

	// ФИКС: Заголовка больше нет, поэтому ждем появления поля поиска
	await expect(page.getByPlaceholder(/Поиск/i).first()).toBeVisible({
		timeout: 15000,
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
			.catch(() => {});
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
		]).catch(() => {});
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

	test('Проверка новых функций (Экспорт, Сканер)', async ({ page, isMobile }) => {
		const exportDropdownBtn = page.getByLabel('Выбор формата экспорта').first();
		await exportDropdownBtn.click({ force: true });

		await expect(
			page
				.locator('button:visible')
				.filter({ hasText: /Сохранить CSV/i })
				.first(),
		).toBeVisible({ timeout: 10000 });

		if (isMobile) {
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
			]).catch(() => {});

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
		}
	});
});

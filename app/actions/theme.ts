'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle/drizzle';
import { systemSettings } from '@/lib/db/drizzle/schema';

const THEME_HUE_KEY = 'app_theme_hue';

export async function getGlobalThemeHue(): Promise<number | null> {
	try {
		const setting = await db.query.systemSettings.findFirst({
			where: eq(systemSettings.key, THEME_HUE_KEY),
		});

		if (setting && setting.value) {
			return parseInt(setting.value, 10);
		}
		return null;
	} catch (error) {
		console.error('Failed to get global theme hue:', error);
		return null;
	}
}

export async function setGlobalThemeHue(hue: number): Promise<boolean> {
	try {
		const existing = await db.query.systemSettings.findFirst({
			where: eq(systemSettings.key, THEME_HUE_KEY),
		});

		if (existing) {
			await db
				.update(systemSettings)
				.set({ value: hue.toString(), updatedAt: new Date() })
				.where(eq(systemSettings.key, THEME_HUE_KEY));
		} else {
			await db.insert(systemSettings).values({
				key: THEME_HUE_KEY,
				value: hue.toString(),
			});
		}
		return true;
	} catch (error) {
		console.error('Failed to set global theme hue:', error);
		return false;
	}
}

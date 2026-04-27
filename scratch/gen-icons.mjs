import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const source =
	'C:/Users/Asus/.gemini/antigravity/brain/3e1e0e88-dd7c-40a1-be7b-2c952e8ecb5c/modern_lims_favicon_1777201861772.png';
const publicDir = 'c:/Projects/Coursa2/lab-journal/public';

async function generateIcons() {
	// favicon.ico (using 32x32)
	await sharp(source).resize(32, 32).toFile(path.join(publicDir, 'favicon.ico'));

	// icon.png (192x192)
	await sharp(source).resize(192, 192).toFile(path.join(publicDir, 'icon.png'));

	// apple-touch-icon.png (180x180)
	await sharp(source).resize(180, 180).toFile(path.join(publicDir, 'apple-touch-icon.png'));

	// icon-512.png (512x512)
	await sharp(source).resize(512, 512).toFile(path.join(publicDir, 'icon-512.png'));

	console.log('Icons generated successfully.');
}

generateIcons().catch(console.error);

import {defineConfig, globalIgnores} from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * ESLint конфиг для Next.js + TypeScript:
 * - Использует рекомендованные правила core-web-vitals и typescript от next
 * - Игнорирует служебные/сборочные директории и файлы окружения
 * - Готов к расширению/кастомизации под проект
 */
const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	/** Общие исключения (авто-сборка и окружение) */
	globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
	/** Можно добавить дополнительные правила или плагины ниже */
	// {
	//   rules: {
	//     // Например, включить более строгий режим:
	//     "@typescript-eslint/explicit-function-return-type": "warn",
	//     "react/jsx-uses-react": "off", // Next.js >=17 не требует import React
	//     "react/react-in-jsx-scope": "off",
	//   }
	// },
]);

export default eslintConfig;

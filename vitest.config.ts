import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		environment: 'jsdom',
		include: ['**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
		exclude: ['node_modules', 'dist', '.next'],
		globals: true,
		setupFiles: ['./tests/setup.ts'],
		coverage: {
			reporter: ['text', 'lcov'],
			provider: 'v8',
			exclude: ['**/*.d.ts', 'tests/**'],
		},
		reporters: ['default'],
		watch: false,
		clearMocks: true,
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, '.'),
		},
	},
});

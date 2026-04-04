/**
 * PostCSS config (Tailwind CSS v4).
 * Документация:
 *   https://tailwindcss.com/docs/installation
 *   https://github.com/postcss/postcss/blob/main/docs/plugins.md
 * @type {import('postcss-load-config').Config}
 */
const config = {
  plugins: [
    require("@tailwindcss/postcss")(),
    // Можно добавить другие плагины PostCSS по необходимости:
    // require("autoprefixer"),
    // require("postcss-nesting"),
  ],
};

export default config;
import type { NextConfig } from "next";

/**
 * Конфиг Next.js с улучшенной сборкой:
 * - Включен tree-shaking только для lucide-react (ускоряет загрузку и уменьшает размер бандла иконок)
 * - Потенциально удобно расширять список библиотек для оптимизации
 */
const nextConfig: NextConfig = {
  experimental: {
    // Можно добавить другие библиотеки для tree-shaking
    optimizePackageImports: [
      "lucide-react",
      // например, добавить другие библиотеки: "date-fns", "lodash-es"
    ],
  },
  // Пример: другие настройки оптимизации/улучшения можно включить при необходимости
  // reactStrictMode: true,
  // swcMinify: true,
};

export default nextConfig;
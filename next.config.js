/** @type {import('next').NextConfig} */
const nextConfig = {
  // Убираем output: 'export' для работы с API routes
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;

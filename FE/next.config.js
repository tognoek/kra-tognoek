/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, { dev }) {
    // Tắt source map phía server trong môi trường dev để tránh cảnh báo
    if (dev) {
      config.devtool = false;
    }
    return config;
  },
};

module.exports = nextConfig;


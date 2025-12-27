const nextConfig = {
  reactStrictMode: true,
  webpack(config, { dev }) {
    if (dev) {
      config.devtool = false;
    }
    return config;
  },
};

module.exports = nextConfig;


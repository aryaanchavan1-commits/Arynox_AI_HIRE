/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  webpack: (config) => {
    config.externals = config.externals || [];
    return config;
  },
};

module.exports = nextConfig;

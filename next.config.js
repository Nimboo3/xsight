/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow images from Shopify CDN
  images: {
    domains: ['cdn.shopify.com'],
  },
  // Environment variables that will be available on the client
  env: {
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
  },
  // API rewrites to proxy requests to Express backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

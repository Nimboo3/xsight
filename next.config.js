/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow images from Shopify CDN
  images: {
    domains: ['cdn.shopify.com'],
  },
  // Environment variables available on client
  env: {
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
    // For production: set NEXT_PUBLIC_API_URL to your Railway backend
    // For local dev: leave empty to use the proxy below
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE || 'false',
  },
  // Proxy API requests to Express backend in development
  // This avoids cross-origin cookie issues
  async rewrites() {
    // Only proxy in development when no external API URL is set
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL) {
      return [
        {
          source: '/api/auth/:path*',
          destination: 'http://localhost:3000/api/auth/:path*',
        },
        {
          source: '/api/v1/:path*',
          destination: 'http://localhost:3000/api/v1/:path*',
        },
      ];
    }
    return [];
  },
  // Disable eslint during build for faster deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable typescript errors during build for demo deployment
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;

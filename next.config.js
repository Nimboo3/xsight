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

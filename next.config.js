/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_GOOGLE_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    ZALO_OA_TOKEN: process.env.ZALO_OA_TOKEN
  }
};

module.exports = nextConfig;
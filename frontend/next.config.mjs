import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  outputFileTracingRoot: __dirname,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async rewrites() {
    const backendTarget =
      process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
    const cleanTarget = backendTarget.replace(/\/api\/?$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${cleanTarget}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${cleanTarget}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

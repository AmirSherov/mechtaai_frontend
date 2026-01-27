import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mechtaai.ru'
let apiHostname = 'api.mechtaai.ru'
let apiProtocol: 'http' | 'https' = 'https'
try {
  const parsed = new URL(apiUrl)
  apiHostname = parsed.hostname
  apiProtocol = (parsed.protocol.replace(':', '') as 'http' | 'https') || 'https'
} catch {
  apiHostname = 'api.mechtaai.ru'
  apiProtocol = 'https'
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiProtocol,
        hostname: apiHostname,
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api.mechtaai.ru',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/uploads/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet',
          },
        ],
      },
    ]
  },
};

export default nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['onactive.shop', 'www.onactive.shop', '*.onactive.shop'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'hnyilsmevqenwpspuguz.supabase.co',
      },
    ],
  },
};

export default nextConfig;

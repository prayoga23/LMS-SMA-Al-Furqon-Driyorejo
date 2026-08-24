import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  devIndicators: false,
  outputFileTracingIncludes: {
    '/*': ['./prisma/dev.db', './prisma/schema.prisma'],
    '/api/**/*': ['./prisma/dev.db', './prisma/schema.prisma'],
  },
};

export default nextConfig;

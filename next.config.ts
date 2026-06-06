import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: '/muebleuno',
  assetPrefix: '/muebleuno',
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['sharp'],
  async headers() {
    return [
      {
        // HTML pages: no cache
        source: '/muebleuno/((?!_next/static|uploads).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Cloudflare-CDN-Cache-Control', value: 'no-store' },
        ],
      },
      {
        // Static assets: cache 1 year (tienen hash en el nombre)
        source: '/muebleuno/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Uploads: cache 7 días
        source: '/muebleuno/uploads/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800' },
        ],
      },
    ]
  },
}

export default nextConfig

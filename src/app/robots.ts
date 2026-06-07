import { MetadataRoute } from 'next'
import { SITE_URL, BASE_PATH } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: `${BASE_PATH}/`,
        disallow: [`${BASE_PATH}/admin/`, `${BASE_PATH}/api/`],
      },
    ],
    sitemap: `${SITE_URL}${BASE_PATH}/sitemap.xml`,
  }
}

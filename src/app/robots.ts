import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/customers/', '/invoices/', '/settings/', '/reports/'],
    },
    sitemap: 'https://invozaapp.vercel.app/sitemap.xml',
  };
}

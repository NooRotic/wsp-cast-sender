import type { MetadataRoute } from 'next';

// Required by `output: 'export'` — see sitemap.ts for full context.
export const dynamic = 'force-static';

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://walter.pollardjr.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}

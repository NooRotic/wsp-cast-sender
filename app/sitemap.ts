import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://walter.pollardjr.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`,                          lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/timeline/`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/cast-demo/`,                lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/cast-debug/`,               lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/media-demo/`,               lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/media-twitch-support/`,     lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/media-twitch-dashboard/`,   lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/twitch-glazer/`,            lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/unified-player-test/`,      lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];
}

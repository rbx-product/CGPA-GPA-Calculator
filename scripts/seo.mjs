// Writes robots.txt and sitemap.xml into dist/ using the real site URL.
import { writeFileSync } from 'node:fs';
const site = (process.env.VITE_SITE_URL || 'https://YOUR-USERNAME.github.io/rbx-cgpa-calculator/').replace(/\/?$/, '/');
if (site.includes('YOUR-USERNAME')) console.warn('! VITE_SITE_URL not set: sitemap uses a placeholder. See README.');
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site}sitemap.xml\n`);

import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://silverpalaceguide.com',
  output: 'static',
  trailingSlash: 'always',
  // Keep executable scripts external so the Pages CSP can allow only same-origin scripts.
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [sitemap({ filter: (page) => !page.includes('/search/') && !page.includes('/characters/') && new URL(page).pathname !== '/' })],
});

// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://chem-is-try.com',
  output: 'static',
  build: {
    assets: 'assets',
  },
  integrations: [sitemap()],
});

/** Astro config: the site address comes from the data file, the sitemap is generated, the dev toolbar is off, the dev server accepts the tailnet host. */
// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import metadata from './data/metadata.json' with { type: 'json' };
import dev from './scripts/dev.json' with { type: 'json' };
import { allowedHosts } from './scripts/tailnet.mjs';

export default defineConfig({
  site: metadata.company.siteUrl,
  output: 'static',
  build: {
    assets: 'assets',
  },
  devToolbar: { enabled: false },
  vite: { server: { allowedHosts: allowedHosts(process.env[dev.hostsEnv]) } },
  integrations: [sitemap()],
});

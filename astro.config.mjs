// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

const directusUrl =
  process.env.PUBLIC_DIRECTUS_URL ||
  process.env.DIRECTUS_URL ||
  'https://admin.battistel.com';
const normalizedDirectusUrl = directusUrl
  .trim()
  .replace('battistel.prometeo.com', 'admin.battistel.com');
const parsedDirectusUrl = normalizedDirectusUrl.startsWith('http://') || normalizedDirectusUrl.startsWith('https://')
  ? normalizedDirectusUrl
  : `https://${normalizedDirectusUrl || 'admin.battistel.com'}`;
let directusProtocol = 'https';
let directusHostname = 'admin.battistel.com';

try {
  const parsed = new URL(parsedDirectusUrl);
  directusProtocol = parsed.protocol.replace(':', '');
  directusHostname = parsed.hostname;
} catch {
  // Fall back to defaults if env is invalid.
}

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  build: {
    inlineStylesheets: 'always'
  },
  image: {
    domains: [directusHostname],
    remotePatterns: [
      {
        protocol: directusProtocol,
        hostname: directusHostname,
        port: '',
        pathname: '/assets/**'
      }
    ]
  },
  vite: {
    ssr: {
      noExternal: ['astro/jsx-runtime']
    }
  }
});

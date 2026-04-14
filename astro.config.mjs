// @ts-check
import { defineConfig } from 'astro/config';

const directusUrl =
  process.env.PUBLIC_DIRECTUS_URL ||
  process.env.DIRECTUS_URL ||
  'https://battistel.prometeo.com';
let directusProtocol = 'https';
let directusHostname = 'battistel.prometeo.com';

try {
  const parsed = new URL(directusUrl);
  directusProtocol = parsed.protocol.replace(':', '');
  directusHostname = parsed.hostname;
} catch {
  // Fall back to defaults if env is invalid.
}

// https://astro.build/config
export default defineConfig({
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

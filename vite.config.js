import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages (dev) serves the site from /ospreyvisuals2/. Cloudflare builds set VITE_BASE=/
  base: process.env.VITE_BASE || '/ospreyvisuals2/',
  plugins: [react()],
  build: {
    // Keep images as separate files (never inlined as base64) so the browser can cache them.
    assetsInlineLimit: 0,
  },
});

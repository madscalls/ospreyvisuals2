import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Cloudflare serves the site from the root. The old GitHub Pages preview sets VITE_BASE=/ospreyvisuals2/ in its workflow.
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  build: {
    // Keep images as separate files (never inlined as base64) so the browser can cache them.
    assetsInlineLimit: 0,
  },
});

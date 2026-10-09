import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/ospreyvisuals2/',
  plugins: [react()],
  build: {
    // Keep images as separate files (never inlined as base64) so the browser can cache them.
    assetsInlineLimit: 0,
  },
});

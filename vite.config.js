import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
  },
  css: {
    postcss: './postcss.config.js',
  },
  optimizeDeps: {
    include: ['jsmediatags'], // Pre-bundle jsmediatags
    esbuildOptions: {
      // Force CommonJS resolution for jsmediatags
      mainFields: ['module', 'main'],
      conditions: ['browser'],
    },
  },
  ssr: {
    noExternal: ['jsmediatags'], // Ensure jsmediatags is bundled as CommonJS
  },
});
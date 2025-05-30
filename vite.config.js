import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react()],
    tailwindcss(),
  base: '/', // Ensures correct asset paths for Cloudflare Pages
});
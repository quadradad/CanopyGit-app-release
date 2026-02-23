import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'images',
  build: {
    outDir: 'dist/renderer',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3777',
    },
  },
});

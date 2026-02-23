import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'dist/server',
    ssr: true,
    target: 'node18',
    rollupOptions: {
      input: path.resolve(__dirname, 'src/server/index.ts'),
      external: ['better-sqlite3'],
      output: {
        entryFileNames: 'index.js',
        format: 'cjs',
      },
    },
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
});

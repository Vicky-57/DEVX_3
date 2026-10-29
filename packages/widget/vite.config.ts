import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@cartx/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'CartX',
      fileName: () => 'cartx.js',
      formats: ['iife'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        exports: 'default',
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});

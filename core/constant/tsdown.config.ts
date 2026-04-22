import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.js'],
  format: ['esm', 'cjs'],
  clean: true,
  outDir: 'dist',
});

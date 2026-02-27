import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: ['demo.bingo-barry.nl'],
  },
  test: {
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**'],
  },
});

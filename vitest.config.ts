import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**', // Exclude Playwright e2e tests
      '**/src/test/integration/**', // Exclude integration tests
      '**/src/components/FlashCardApp.test.tsx', // Obsolete - uses old openrouter import
      '**/src/components/LoginForm.test.tsx', // Obsolete - uses old auth import
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
      ],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});

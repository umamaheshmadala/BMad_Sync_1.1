import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['tests/setup.ts'],
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    reporters: ['default'],
  },
});



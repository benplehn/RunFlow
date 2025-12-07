import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    testTimeout: 10000 // API tests may need more time
  },
  resolve: {
    alias: {
      '@runflow/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
      '@runflow/config': path.resolve(__dirname, '../../packages/config/src/index.ts'),
      '@runflow/schemas': path.resolve(__dirname, '../../packages/schemas/src/index.ts'),
      '@runflow/domain': path.resolve(__dirname, '../../packages/domain/src/index.ts'),
      '@runflow/services': path.resolve(__dirname, '../../packages/services/src/index.ts'),
      '@runflow/telemetry': path.resolve(__dirname, '../../packages/telemetry/src/index.ts')
    }
  }
});

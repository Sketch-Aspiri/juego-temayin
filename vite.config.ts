import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readBuildInfo } from './scripts/buildInfo.ts';

export default defineConfig({
  base: './',
  plugins: [react()],
  define: { __BUILD_INFO__: JSON.stringify(readBuildInfo()) },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});

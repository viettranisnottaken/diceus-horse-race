import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'json-summary'],
        reportsDirectory: './coverage',
        exclude: [
          ...configDefaults.exclude,
          'e2e/**',
          '**/*.config.*',
          '**/constants/**',
          '**/__tests__/**',
          '**/models/**',
          'src/main.ts',
          'src/App.vue',
          'src/router/**',
          'src/views/**',
          'src/components/icons/**',
          'src/components/AnimationContainer.vue', // Draft component
          '**/*.d.ts',
        ],
        thresholds: {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85,
        },
      },
    },
  }),
)

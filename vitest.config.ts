import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      // istanbul, not v8: the suite runs under Bun (`bun --bun vitest`) and the
      // v8 provider needs node:inspector coverage hooks that Bun does not
      // expose, so it reports 0% for everything.
      provider: 'istanbul',
      reporter: ['text-summary', 'text', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        // Vendored third-party code, not ours to test:
        // a prototype-style stack-blur implementation and Facebook's
        // normalize-wheel, both copied in wholesale.
        'src/utils/blur.ts',
        'src/utils/UniversalScroll/**',
        // Type-only modules erase to nothing at runtime.
        '**/interfaces.ts',
        // Declares a class but exports nothing and is imported nowhere, so
        // there is no reachable code to exercise. Delete it rather than test it.
        'src/utils/styleManager.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})

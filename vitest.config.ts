import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    // Run west of Greenwich on purpose. CI runners default to UTC, where a
    // UTC-parsed date and a local-formatted one agree and date-handling bugs
    // pass unnoticed — that is exactly how the experience dates shipped a month
    // early. Pinning a non-UTC zone keeps those regression tests meaningful.
    env: {
      TZ: 'America/New_York',
    },
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

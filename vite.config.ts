import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: fileURLToPath(new URL('dist', import.meta.url)),
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('index.html', import.meta.url)),
      },
    },
  },
})

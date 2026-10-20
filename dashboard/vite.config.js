import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://ae-chrono-log.hilmiizamzamii.workers.dev',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
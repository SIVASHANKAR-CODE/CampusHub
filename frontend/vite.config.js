import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config({ path: path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../backend/.env') })

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'campushub-api',
      async configureServer(server) {
        const { connectDB } = await import('../backend/config/db.js')
        try {
          await connectDB()
          console.log('[CampusHub] MongoDB connected for the integrated Vite API.')
        } catch (error) {
          console.warn(`[CampusHub] MongoDB unavailable in Vite API mode: ${error.message}`)
        }
        const { default: backendApp } = await import('../backend/app.js')
        server.middlewares.use((request, response, next) => {
          const pathname = request.url?.split('?')[0] || ''
          if (pathname === '/api' || pathname.startsWith('/api/') || pathname === '/uploads' || pathname.startsWith('/uploads/')) {
            return backendApp(request, response, next)
          }
          return next()
        })
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
  },
})

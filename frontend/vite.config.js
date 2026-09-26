import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Plugin de Vite para servir los archivos JSON simulando un backend
const servirBackend = () => ({
  name: 'servir-backend',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url.startsWith('/backend/data/')) {
        const fileName = req.url.replace('/backend/data/', '')
        const filePath = path.join(__dirname, '..', 'Back', 'data', fileName)
        
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8')
          res.setHeader('Content-Type', 'application/json')
          res.end(content)
          return
        } else {
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'Not found' }))
          return
        }
      }
      next()
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), servirBackend()],
  server: {
    watch: {
      usePolling: true, 
    }
  },
})

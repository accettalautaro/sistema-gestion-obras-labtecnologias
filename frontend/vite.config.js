import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// 1. Adaptado a tu carpeta "Back"
const CARPETA_BACKEND = path.resolve(__dirname, '../Back') 

function servirBackend() {
  let configuracion

  function middleware(req, res, next) {
    let url
    try {
      url = decodeURIComponent((req.url ?? '').split('?')[0])
    } catch {
      return next()
    }
    
    // 2. Adaptado a la URL que usas en tus fetch ('/Back/')
    if (!url.startsWith('/Back/')) return next() 

    const archivo = path.resolve(CARPETA_BACKEND, '.' + url.slice('/Back'.length))
    const esValido =
      archivo.startsWith(CARPETA_BACKEND + path.sep) && 
      archivo.endsWith('.json') &&
      fs.existsSync(archivo)

    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    if (!esValido) {
      res.statusCode = 404
      return res.end(JSON.stringify({ error: 'Recurso no encontrado' }))
    }
    fs.createReadStream(archivo).pipe(res)
  }

  return {
    name: 'servir-backend',
    configResolved(config) {
      configuracion = config
    },
    configureServer(server) {
      server.middlewares.use(middleware) 
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware) 
    },
    closeBundle() {
      if (configuracion.command !== 'build') return
      // 3. Adaptado para que al compilar se copie a dist/Back/data
      const destino = path.resolve(configuracion.root, configuracion.build.outDir, 'Back/data')
      fs.cpSync(path.join(CARPETA_BACKEND, 'data'), destino, { recursive: true })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    servirBackend(),
  ],
  server: {
    watch: {
      usePolling: true, 
    }
  },
})
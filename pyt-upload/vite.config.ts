import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
// mode 'pages'  -> compilación estática de demostración para GitHub Pages
//                  (sin backend; VITE_STATIC=true; salida en docs/)
// mode normal  -> versión completa con backend Express + SQLite (salida en dist/)
export default defineConfig(({ mode }) => {
  const isPages = mode === 'pages'
  return {
    base: './',
    plugins: [inspectAttr(), react()],
    define: {
      'import.meta.env.VITE_STATIC': JSON.stringify(isPages ? 'true' : 'false'),
    },
    server: {
      port: 3000,
    },
    build: {
      outDir: isPages ? 'docs' : 'dist',
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
});

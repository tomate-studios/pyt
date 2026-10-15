import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// En la compilación estática (GitHub Pages) se usa HashRouter porque Pages
// no reescribe rutas; en la versión con backend, BrowserRouter normal.
const Router = import.meta.env.VITE_STATIC === 'true' ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Importante: Dependendo de como você instalou o Tailwind/Shadcn, 
// este arquivo de estilos pode se chamar './globals.css' ou './index.css'.
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'fontawesome6pro/css/all.min.css'
import './style.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

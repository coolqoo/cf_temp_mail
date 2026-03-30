import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MainApp from './App'
import { AppProvider } from './store'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <MainApp />
    </AppProvider>
  </StrictMode>,
)

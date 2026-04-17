import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { notifyOfficeBootstrapChanged } from './utils/office-env'

const startupBanner = String.raw`
TTTTTT  EEEEEE  RRRRR   RRRRR   Y   Y
  TT    EE      RR  RR  RR  RR   Y Y
  TT    EEEEE   RRRRR   RRRRR     Y
  TT    EE      RR RR   RR RR     Y
  TT    EEEEEE  RR  RR  RR  RR    Y
`

function logStartupBanner() {
  console.log(`\n${startupBanner}\n`)
}

function renderApp() {
  logStartupBanner()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

/* Ensure Office API is loaded before rendering */
if (typeof Office !== 'undefined') {
  Office.onReady(() => {
    if (typeof window !== 'undefined' && window.__officeBootstrap) {
      window.__officeBootstrap.onReadyResolved = true
      notifyOfficeBootstrapChanged()
    }
    renderApp()
  })
} else {
  renderApp()
}

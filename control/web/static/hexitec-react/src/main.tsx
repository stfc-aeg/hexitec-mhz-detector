import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { OdinErrorContext } from 'odin-react'
import { SystemMonitorOverlay } from './components/admonitor/MonitorOverlay.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OdinErrorContext>
      <SystemMonitorOverlay />
      <App/>
    </OdinErrorContext>
  </StrictMode>,
)
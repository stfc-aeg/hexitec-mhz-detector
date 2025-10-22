import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { OdinErrorContext, useAdapterEndpoint } from 'odin-react'
import { ADMonitor } from './components/admonitor/ADMonitor'
import FocusLock from 'react-focus-lock'

function AppWithSystemMonitor() {
  const url = import.meta.env.VITE_ENDPOINT_URL;
  const endpoint = useAdapterEndpoint('hexitec', url, 500);
  
  const isCriticalState = () => {
    const adxdmaData = endpoint.data?.mhz_monitor;
    if (!adxdmaData) return false;
    
    const { current_state, current_retry, max_retries } = adxdmaData;
    
    const criticalStates = [
      'Resetting',
      'WaitingForLanes',
      'Rebonding',
      'WaitingForChannels',
      'Reactivating',
      'Error'
    ];
    
    return (
      criticalStates.includes(current_state) ||
      (current_retry || 0) >= (max_retries || 3)
    );
  };

  const showOverlay = isCriticalState();

  return (
    <>
      <div 
        style={{ 
          filter: showOverlay ? 'blur(2px)' : 'none',
          transition: 'filter 0.3s ease-in-out'
        }}
        aria-hidden={showOverlay}
        // @ts-ignore
        inert={showOverlay ? "" : undefined}
      >
        <App />
      </div>

      {showOverlay && (
        <FocusLock returnFocus={false}>
          <ADMonitor 
            endpoint={endpoint}
            show={showOverlay}
          />
        </FocusLock>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OdinErrorContext>
      <AppWithSystemMonitor />
    </OdinErrorContext>
  </StrictMode>,
)
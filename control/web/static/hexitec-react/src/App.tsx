import 'bootstrap/dist/css/bootstrap.min.css';
import { OdinApp, useAdapterEndpoint } from '@dssg/odin-react';
import Acquisition from './components/acquisition/Acquisition';
import { HistogramLiveView } from './components/liveview/HistogramLiveView';

import { UserLevelContext } from './components/UserAware';
import type { HexitecParamTree } from './components/admonitor/MonitorOverlay';
import Configuration from './components/configuration/Configuration';

import Sequencer from './components/Sequencer';
import LokiExtra from './components/LokiExtra';

import { Button } from 'react-bootstrap';
import { TooltipProvider, useTooltips } from './tooltipcontext';

function TooltipToggle() {
  const { enabled, setEnabled } = useTooltips();

  return (
    <Button
      size="sm"
      variant="outline-primary"
      aria-pressed={enabled}
      onClick={() => setEnabled(!enabled)}
      className="d-none d-lg-block"
      style={{
        position: 'fixed',
        top: '0.75rem',
        right: '7.5rem',
        zIndex: 1100,
      }}
    >
      Tooltips: {enabled ? 'On' : 'Off'}
    </Button>
  );
}



function App() {
  const endpoint_url = import.meta.env.VITE_ENDPOINT_URL;

  const endpoint = useAdapterEndpoint<HexitecParamTree>('hexitec', endpoint_url);

  return (
    <UserLevelContext value={endpoint.data?.user_type ?? "basic"}>
      <TooltipProvider>
        <TooltipToggle />
        <OdinApp 
          title={'Hexitec-MHZ'} 
          navLinks={[
            'Configuration',  
            'Acquisition', 
            'Live View',
            'Sequencer',
            'LOKI Extras'
          ]}
        >
          <Configuration endpoint_url={endpoint_url} />
          <Acquisition endpoint_url={endpoint_url} />
          <HistogramLiveView endpoint_url={endpoint_url} name="mhz"/>
          <Sequencer endpoint_url={endpoint_url} />
          <LokiExtra endpoint_url={endpoint_url} />
        </OdinApp>
      </TooltipProvider>
    </UserLevelContext>
  );
}

export default App;

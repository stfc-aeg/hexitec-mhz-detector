import 'bootstrap/dist/css/bootstrap.min.css';
import { OdinApp, useAdapterEndpoint } from 'odin-react';
import Acquisition from './pages/Acquisition';
import { HistogramLiveView } from './components/liveview/HistogramLiveView';

import { UserLevelContext } from './components/UserAware';
import type { HexitecParamTree } from './components/admonitor/MonitorOverlay';
import Configuration from './pages/Configuration';

import Sequencer from './pages/Sequencer';

function App() {
  const endpoint_url = import.meta.env.VITE_ENDPOINT_URL;

  const endpoint = useAdapterEndpoint<HexitecParamTree>('hexitec', endpoint_url);

  return (
    <UserLevelContext value={endpoint.data.user_type}>
      <OdinApp 
        title={'Hexitec-MHZ'} 
        navLinks={[
          'Configuration',  
          'Acquisition', 
          'Live View',
          'Sequencer'
        ]}
      >
        <Configuration endpoint_url={endpoint_url} />
        <Acquisition endpoint_url={endpoint_url} />
        <HistogramLiveView endpoint_url={endpoint_url} name={"detector1"}/>
        <Sequencer endpoint_url={endpoint_url} />
      </OdinApp>
    </UserLevelContext>
  );
}

export default App;
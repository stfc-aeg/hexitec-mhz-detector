import 'bootstrap/dist/css/bootstrap.min.css';
import { OdinApp } from 'odin-react';
import CameraControl from './pages/CameraControl';
import Processing from './pages/Processing';
import Acquisition from './pages/Acquisition';
import AsicControl from './pages/AsicControl';
import RegisterMap from './pages/RegisterMap';

import { HistogramLiveView } from './components/liveview/HistogramLiveView';
import HistogramControl from './pages/Histogrammer';

function App() {
  const endpoint_url = import.meta.env.VITE_ENDPOINT_URL;

  return (
    <OdinApp 
      title={'Hexitec-MHZ'} 
      navLinks={[
        'Camera Control', 
        'Processing', 
        'Acquisition', 
        'Live View', 
        'Histogrammer Control',
        'ASIC Control', 
        'Register Map'
      ]}
    >
      <CameraControl endpoint_url={endpoint_url} />
      <Processing endpoint_url={endpoint_url} />
      <Acquisition endpoint_url={endpoint_url} />
      <HistogramLiveView endpoint_url={endpoint_url} name={"detector1"}/>
      <HistogramControl endpoint_url={endpoint_url} />
      <AsicControl endpoint_url={endpoint_url} />
      <RegisterMap endpoint_url={endpoint_url} />
    </OdinApp>
  );
}

export default App;
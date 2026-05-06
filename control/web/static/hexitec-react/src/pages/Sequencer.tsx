import { useAdapterEndpoint } from 'odin-react';
import { OdinSequencer } from 'odin-sequencer-react-ui';

interface SequencerProps {
    endpoint_url: string;
}


function Sequencer({ endpoint_url}: SequencerProps) {
    const sequencerEndpoint = useAdapterEndpoint('sequencer', endpoint_url, 1000);

    return (
      <OdinSequencer endpoint={sequencerEndpoint}/>
    )
}

export default Sequencer;
import { OdinSequencer } from 'odin-sequencer-ui';

interface SequencerProps {
    endpoint_url: string;
}


function Sequencer({ endpoint_url}: SequencerProps) {

    return (
      <OdinSequencer endpoint_name={'sequencer'} endpoint_url={endpoint_url} poll_interval={1000}/>
    )
}

export default Sequencer;
import { Container, Row, Col } from 'react-bootstrap';
import { useAdapterEndpoint } from 'odin-react';
import type { ProxyParams, HistogramTypes, MetadataType } from '../EndpointTypes';
import Environmental from '../components/configuration/Environmental';
import Processing from '../components/configuration/Processing';
import FileUploads from '../components/configuration/FileUploads';
import DetectorControls from '../components/configuration/DetectorControls';

interface ConfigurationProps {
  endpoint_url: string;
}

function Configuration({ endpoint_url }: ConfigurationProps) {
  const proxyEndpoint = useAdapterEndpoint<ProxyParams>('proxy', endpoint_url, 1000);
  const histogramEndpoint = useAdapterEndpoint<HistogramTypes>('histogram', endpoint_url, 500);

  return (
    <Container>
      <Row>
        <Col md={6}>
          <Environmental
            proxyEndpoint={proxyEndpoint}
          />
          <FileUploads
            histogramEndpoint={histogramEndpoint}
          />
        </Col>
        <Col md={6}>
          <Processing
            histogramEndpoint={histogramEndpoint}
          />
          <DetectorControls 
            proxyEndpoint={proxyEndpoint}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default Configuration;

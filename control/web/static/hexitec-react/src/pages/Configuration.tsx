import { Container, Row, Col, Form, FloatingLabel, Button} from 'react-bootstrap';
import { useAdapterEndpoint, WithEndpoint, EndpointButton } from 'odin-react';
import type { ProxyParams, HistogramTypes, AcquisitionTypes } from '../EndpointTypes';
import { floatingInputStyle } from '../utils.js';
import Environmental from '../components/configuration/Environmental';
import Processing from '../components/configuration/Processing';
import FileUploads from '../components/configuration/FileUploads';
import DetectorControls from '../components/configuration/DetectorControls';

interface ConfigurationProps {
  endpoint_url: string;
}

const EndpointFormSelect = WithEndpoint(Form.Select);

function Configuration({ endpoint_url }: ConfigurationProps) {
  const proxyEndpoint = useAdapterEndpoint<ProxyParams>('proxy', endpoint_url, 1000);
  const histogramEndpoint = useAdapterEndpoint<HistogramTypes>('histogram', endpoint_url, 500);
  const acquisitionEndpoint = useAdapterEndpoint<AcquisitionTypes>('acquisition', endpoint_url, 1000);

  const availableProfiles = acquisitionEndpoint.data?.config?.config_profile?.available ?? [''];

  return (
    <Container>
      <Row className="mt-2">
        <Col>
          <Row>
            <Col>
              <EndpointButton
                endpoint={acquisitionEndpoint}
                fullpath="config/config_profile/available"
                variant='outline-primary'
                style={{height:'100%'}}
              >
                Refresh Profiles
              </EndpointButton>
            </Col>
            <Col xs={8}>
              <FloatingLabel label="Choose configuration profile">
                <EndpointFormSelect
                  endpoint={acquisitionEndpoint}
                  fullpath="config/config_profile/current"
                  style={floatingInputStyle}>
                    {availableProfiles?.map((profile: string) => (
                      <option label={profile} value={profile}>{profile}</option>
                    ))}
                </EndpointFormSelect>
              </FloatingLabel>
            </Col>
          </Row>
        </Col>
        <Col>
          save settings as profile
        </Col>
      </Row>
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
            acquisitionEndpoint={acquisitionEndpoint}
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

import { Container, Row, Col, Form, FloatingLabel, Alert } from 'react-bootstrap';
import { useAdapterEndpoint, WithEndpoint, EndpointButton } from 'odin-react';
import type { ProxyParams, HistogramTypes, AcquisitionTypes } from '../EndpointTypes';
import { floatingInputStyle } from '../utils.js';
import Environmental from '../components/configuration/Environmental';
import Processing from '../components/configuration/Processing';
import FileUploads from '../components/configuration/FileUploads';
import DetectorControls from '../components/configuration/DetectorControls';
import { useState } from 'react';

interface ConfigurationProps {
  endpoint_url: string;
}

const EndpointFormSelect = WithEndpoint(Form.Select);

function Configuration({ endpoint_url }: ConfigurationProps) {
  const proxyEndpoint = useAdapterEndpoint<ProxyParams>('proxy', endpoint_url, 1000);
  const histogramEndpoint = useAdapterEndpoint<HistogramTypes>('histogram', endpoint_url, 500);
  const acquisitionEndpoint = useAdapterEndpoint<AcquisitionTypes>('acquisition', endpoint_url, 1000);

  const availableProfiles = acquisitionEndpoint.data?.config?.config_profile?.available ?? [''];
  const isCustomProfile = acquisitionEndpoint.data?.config?.config_profile?.current === "custom";
  const [customName, setCustomName] = useState('new_config');
  const invalidCustomName = customName === '' || customName === 'custom';

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
          <Row>
            <Col>
              <FloatingLabel label="Custom config name">
                <Form.Control
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.currentTarget.value)}
                  style={invalidCustomName ? {
                    ...floatingInputStyle,
                    border: '2px solid red'
                  } : floatingInputStyle}
                  placeholder="Enter custom profile name"
                  disabled={!isCustomProfile}
                />
              </FloatingLabel>
            </Col>
            <Col>
              <EndpointButton
                endpoint={acquisitionEndpoint}
                fullpath="config/config_profile/create_profile"
                value={customName}
                style={{height:'100%'}}
                disabled={!isCustomProfile || invalidCustomName}
              >
                Create custom profile
              </EndpointButton>
            </Col>
          </Row>
        </Col>
      </Row>
      {!isCustomProfile ?
      <Row>
        <Alert
          variant='warning'
          dismissible={false}
          className="mt-2 w-100"
        >
          To edit system parameters, select the 'custom' profile above.
          The configuration made can then be saved using the name input and button on the right.
        </Alert>
      </Row> :
      <></>
      }
      <Row>
        <Col md={6}>
          <Environmental
            proxyEndpoint={proxyEndpoint}
            isCustom={isCustomProfile}
          />
          <FileUploads
            histogramEndpoint={histogramEndpoint}
            isCustom={isCustomProfile}
          />
        </Col>
        <Col md={6}>
          <Processing
            histogramEndpoint={histogramEndpoint}
            acquisitionEndpoint={acquisitionEndpoint}
            isCustom={isCustomProfile}
          />
          <DetectorControls
            proxyEndpoint={proxyEndpoint}
            isCustom={isCustomProfile}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default Configuration;

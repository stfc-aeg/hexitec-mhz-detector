import { useState } from 'react';
import { Container, Row, Col, Form, FloatingLabel, OverlayTrigger } from 'react-bootstrap';
import { useAdapterEndpoint, WithEndpoint, EndpointButton, TitleCard } from 'odin-react';
import type { ProxyParams, HistogramTypes, AcquisitionTypes, ConfigTypes } from '../EndpointTypes';
import { floatingInputStyle } from '../utils.js';
import { tooltips } from '../tooltips';
import Environmental from '../components/configuration/Environmental';
import Processing from '../components/configuration/Processing';
import FileUploads from '../components/configuration/FileUploads';
import DetectorControls from '../components/configuration/DetectorControls';

interface ConfigurationProps {
  endpoint_url: string;
}

const EndpointFormSelect = WithEndpoint(Form.Select);
const EndpointCheck = WithEndpoint(Form.Check);

function Configuration({ endpoint_url }: ConfigurationProps) {
  const proxyEndpoint = useAdapterEndpoint<ProxyParams>('proxy', endpoint_url, 1000);
  const histogramEndpoint = useAdapterEndpoint<HistogramTypes>('histogram', endpoint_url, 500);
  const acquisitionEndpoint = useAdapterEndpoint<AcquisitionTypes>('acquisition', endpoint_url, 1000);
  const configEndpoint = useAdapterEndpoint<ConfigTypes>('config', endpoint_url, 2000);

  const availableProfiles = configEndpoint.data?.available_profiles ?? [''];
  const isCustomProfile = acquisitionEndpoint.data?.config?.config_edit_mode ?? false;
  const [customName, setCustomName] = useState('new_config');
  const invalidCustomName = customName === '';

  const isAcquiring = acquisitionEndpoint.data?.state?.acquisition?.toggle || acquisitionEndpoint.data?.state?.preview?.toggle;
  const configDisabled = isAcquiring || !isCustomProfile;
  const disabledTooltip = isAcquiring ? tooltips.acquisition.disabled_acquiring : tooltips.acquisition.disabled_edit;

  return (
    <Container>
      <TitleCard title={<strong>Configuration Profile Management</strong>}>
        <Row className="mt-2">
          <Col sm={12} md={6}>
            <Row>
              <Col>
                <EndpointButton
                  endpoint={configEndpoint}
                  fullpath="available_profiles"
                  variant='outline-primary'
                  style={{height:'100%'}}
                >
                  Refresh Profiles
                </EndpointButton>
              </Col>
              <Col xs={6}>
                <FloatingLabel label="Choose a profile">
                  <EndpointFormSelect
                    endpoint={configEndpoint}
                    fullpath="current_profile"
                    style={floatingInputStyle}>
                      {availableProfiles?.map((profile: string) => (
                        <option label={profile} value={profile}>{profile}</option>
                      ))}
                  </EndpointFormSelect>
                </FloatingLabel>
              </Col>
              <Col className="d-flex align-items-center">
                <EndpointCheck
                  endpoint={acquisitionEndpoint}
                  fullpath="config/config_edit_mode"
                  label="Enable editing"
                  style={{height:'100%'}}
                />
              </Col>
            </Row>
          </Col>
          <Col>
            <Row>
              <Col>
                <FloatingLabel label="Custom profile name">
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
                  endpoint={configEndpoint}
                  fullpath="create_profile"
                  value={customName}
                  disabled={!isCustomProfile || invalidCustomName}
                >
                  Create new configuration profile
                </EndpointButton>
              </Col>
            </Row>
          </Col>
        </Row>
      </TitleCard>
      
      <div style={{ position: 'relative' }}>
        {configDisabled && (
          <OverlayTrigger placement="top" overlay={disabledTooltip}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255,255,255,0.10)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'auto'
              }}
            />
          </OverlayTrigger>
        )}

        <Row>
          <Col md={6}>
            <Environmental
              proxyEndpoint={proxyEndpoint}
              isCustom={isCustomProfile}
            />
            <FileUploads
              histogramEndpoint={histogramEndpoint}
              isCustom={isCustomProfile}
              isAcquiring={isAcquiring}
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
      </div>
    </Container>
  );
}

export default Configuration;

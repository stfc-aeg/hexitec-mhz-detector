import { useState } from 'react';
import { Button, Container, Row, Col, Form, FloatingLabel, Modal, OverlayTrigger } from 'react-bootstrap';
import { useAdapterEndpoint, EndpointCheckbox, EndpointSelect, EndpointButton, TitleCard } from '@dssg/odin-react';;
import type { ProxyParams, HistogramTypes, AcquisitionTypes, ConfigTypes } from '../../EndpointTypes.js';
import { floatingInputStyle } from '../../utils.js';
import { tooltips } from '../../tooltips.js';
import Environmental from './Environmental.js';
import Processing from './Processing.js';
import FileUploads from './FileUploads.js';
import DetectorControls from './DetectorControls.js';

interface ConfigurationProps {
  endpoint_url: string;
}

function Configuration({ endpoint_url }: ConfigurationProps) {
  const proxyEndpoint = useAdapterEndpoint<ProxyParams>('proxy', endpoint_url, 1000);
  const histogramEndpoint = useAdapterEndpoint<HistogramTypes>('histogram', endpoint_url, 500);
  const acquisitionEndpoint = useAdapterEndpoint<AcquisitionTypes>('acquisition', endpoint_url, 1000);
  const configEndpoint = useAdapterEndpoint<ConfigTypes>('config', endpoint_url, 2000);

  const availableProfiles = configEndpoint.data?.available_profiles ?? [''];
  const isCustomProfile = acquisitionEndpoint.data?.config?.config_edit_mode ?? false;
  const [customName, setCustomName] = useState('');
  const [showSaveProfileModal, setShowSaveProfileModal] = useState(false);
  const invalidCustomName = customName.trim() === '';

  const isAcquiring = (acquisitionEndpoint.data?.state?.acquisition?.toggle || acquisitionEndpoint.data?.state?.preview?.toggle) ?? false;
  const configDisabled = isAcquiring || !isCustomProfile;
  const disabledTooltip = isAcquiring ? tooltips.acquisition.disabled_acquiring : tooltips.acquisition.disabled_edit;
  const closeSaveProfileModal = () => {
    setShowSaveProfileModal(false);
    setCustomName('');
  };

  return (
    <Container>
      <TitleCard title={<strong>Configuration Profile Management</strong>}>
        <Row className="mt-2 justify-content-center align-items-center gy-2">
          <Col xs={12} sm="auto" className="d-flex justify-content-center">
            <EndpointButton
              endpoint={configEndpoint}
              fullpath="available_profiles"
              variant='outline-primary'
            >
              Refresh Profiles
            </EndpointButton>
          </Col>
          <Col xs={12} sm={4} md={3}>
            <FloatingLabel label="Choose a profile">
              <EndpointSelect
                endpoint={configEndpoint}
                fullpath="current_profile"
                style={floatingInputStyle}>
                  {availableProfiles?.map((profile: string) => (
                    <option label={profile} value={profile}>{profile}</option>
                  ))}
              </EndpointSelect>
            </FloatingLabel>
          </Col>
          <Col xs={12} sm="auto" className="d-flex justify-content-center">
            <EndpointCheckbox
              endpoint={acquisitionEndpoint}
              fullpath="config/config_edit_mode"
              type="switch"
              label="Enable editing"
            />
          </Col>
          <Col xs={12} sm="auto" className="d-flex justify-content-center">
            <Button
              variant="outline-primary"
              disabled={!isCustomProfile}
              onClick={() => setShowSaveProfileModal(true)}
            >
              Save Configuration as Profile
            </Button>
          </Col>
        </Row>
      </TitleCard>

      <Modal show={showSaveProfileModal} onHide={closeSaveProfileModal} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Save Configuration Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FloatingLabel label="Profile Name (no extension)">
            <Form.Control
              autoFocus
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.currentTarget.value)}
              style={invalidCustomName ? {
                ...floatingInputStyle,
                border: '2px solid red'
              } : floatingInputStyle}
            />
          </FloatingLabel>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="secondary" onClick={closeSaveProfileModal}>
            Cancel
          </Button>
          <EndpointButton
            endpoint={configEndpoint}
            fullpath="create_profile"
            value={customName.trim()}
            post_method={closeSaveProfileModal}
            disabled={!isCustomProfile || invalidCustomName}
          >
            Save
          </EndpointButton>
        </Modal.Footer>
      </Modal>
      
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

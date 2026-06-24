import { EndpointButton, EndpointCheckbox, EndpointInput, TitleCard, useAdapterEndpoint } from 'odin-react';
import { useState } from 'react';
import { ButtonGroup, Card, Col, Container, FloatingLabel, Form, OverlayTrigger, ProgressBar, Row, ToggleButton } from 'react-bootstrap';
import type { AcquisitionTypes, MunirTypes } from '../EndpointTypes';
import { tooltips } from '../tooltips';
import { floatingInputStyle, floatingLabelStyle } from '../utils.js';

interface AcquisitionProps {
  endpoint_url: string;
}

// const EndpointSelect = WithEndpoint(Form.Select);

function Acquisition({ endpoint_url }: AcquisitionProps) {

  const acquisitionEndpoint = useAdapterEndpoint<AcquisitionTypes>('acquisition', endpoint_url, 1000);
  const acquisitionData = acquisitionEndpoint?.data;

  const [triggerModeValue, setTriggerModeValue] = useState('software');
  const [adTriggerModeValue, setAdTriggerModeValue] = useState('burst mode');

  const estimatedDataRate = acquisitionData?.config?.estimated_data_rate ?? 0;
  const rateTooHigh = estimatedDataRate > 12.5;

  const isAcquiring = acquisitionEndpoint?.data?.state?.acquisition?.toggle;
  const acquisitionProgress = acquisitionEndpoint?.data?.state?.acquisition?.progress_task?.progress;
  const acquisitionProgressLabel = acquisitionProgress?.toString() + '%'

  const acquisitionButtonDisabled = rateTooHigh && !isAcquiring;
  const acquisitionButtonVariant = isAcquiring ? 'danger' : rateTooHigh ? 'danger' : 'primary';
  const triggerModeRadios = [
    { name: 'Hardware', value: 'hardware' },
    { name: 'Software', value: 'software' }
  ];
  const adTriggerModeRadios = [
    { name: 'Burst',  value: 'burst mode' },
    { name: 'Step scan', value: 'step scan' }
  ];
  // your manual use of endpoint.put rather than the WithEndpoint components makes me sad :()
  const handleTriggerModeChange = (value: string) => {
    setTriggerModeValue(value);
    const sendVal = {['device']: value};
    acquisitionEndpoint.put(sendVal, 'config/trigger')
      .then(
        (response) => {
          acquisitionEndpoint.mergeData(response, 'config/trigger');
        }
      );
  }

  const handleAdTriggerModeChange = (value: string) => {
    setAdTriggerModeValue(value);
    const sendVal = {['trigger_mode']: value};
    acquisitionEndpoint.put(sendVal, 'config/trigger')
      .then(
        (response) => {
          acquisitionEndpoint.mergeData(response, 'config/trigger');
        }
      );
  }

  const est_duration = ((acquisitionData?.config?.trigger?.frames_per_timeframe * acquisitionData?.config?.trigger?.number_of_timeframes) / 1000000);

  return (
    
    <Container>
      <Row>
        {/* Trigger Settings */}
        <Col md={6} className="mt-3"> 
          <TitleCard title={<strong>Trigger Settings</strong>}>
            <Row>
              <ButtonGroup>
                {triggerModeRadios.map((radio, idx) => (
                  <OverlayTrigger placement="top" overlay={radio.value === 'hardware' ? tooltips.acquisition.hardware : tooltips.acquisition.software}>
                    <ToggleButton
                      key={idx}
                      className='equal-width-buttongroup'
                      id={`radio-${idx}`}
                      type="radio"
                      variant='outline-primary'
                      name="triggerModeRadio"
                      value={radio.value}
                      checked={triggerModeValue === radio.value}
                      onChange={(e) => handleTriggerModeChange(e.currentTarget.value)}
                    >
                      {radio.name}
                    </ToggleButton>
                  </OverlayTrigger>
                ))}
              </ButtonGroup>
            </Row>
            <Row>
              <ButtonGroup className="mt-3">
                {adTriggerModeRadios.map((radio, idx) => (
                  <ToggleButton
                    key={idx}
                    className='equal-width-buttongroup'
                    id={`ad-trigger-radio-${idx}`}
                    type="radio"
                    variant='outline-secondary'
                    name="adTriggerModeRadio"
                    value={radio.value}
                    checked={adTriggerModeValue === radio.value}
                    onChange={(e) => handleAdTriggerModeChange(e.currentTarget.value)}
                  >
                    {radio.name}
                  </ToggleButton>
                ))}
              </ButtonGroup>
            </Row>
            <Row className="mt-3">
              <Col>
                <FloatingLabel label="Timeframes to write">
                  <EndpointInput
                    endpoint={acquisitionEndpoint} fullpath="config/trigger/number_of_timeframes"
                    type="number"
                    style={floatingInputStyle}
                  />
                </FloatingLabel>
                <FloatingLabel label="Frames per timeframe" className="mt-2">
                  <EndpointInput
                    endpoint={acquisitionEndpoint} fullpath="config/trigger/frames_per_timeframe"
                    type="number"
                    style={floatingInputStyle}
                  />
                </FloatingLabel>
                <FloatingLabel label="Timeframes per trigger" className="mt-2">
                  <EndpointInput
                    endpoint={acquisitionEndpoint} fullpath="config/trigger/timeframes_per_trigger"
                    type="number"
                    style={floatingInputStyle}
                    disabled={triggerModeValue==='software' || !(adTriggerModeValue==='burst mode')}
                  />
                </FloatingLabel>
              </Col>
            </Row>
            <Row className="mt-3">
              <label><strong>Summary</strong></label>
            </Row>
            <Row className="mt-3">
              <Col sm={6}>
                <Row>
                  <Col>
                    <FloatingLabel label="Histograms per Acquisition">
                      <Form.Control
                        type="text"
                        value={acquisitionData?.config?.trigger?.number_of_timeframes.toString()}
                        readOnly
                        style={floatingLabelStyle}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    {/* If in software, this is a predictable outcome. 
                    In hardware mode, it's basically a minimum as triggers may have gaps inbetween */}
                    <OverlayTrigger placement="top" overlay={tooltips.acquisition.est_duration}>
                      <FloatingLabel label="Est. Duration (s)">
                        <Form.Control
                          type="text"
                          value={
                            triggerModeValue === 'software'
                              ? est_duration.toString()
                              : est_duration.toString() + ' minimum'
                          }
                          readOnly
                          style={floatingLabelStyle}
                        />
                      </FloatingLabel>
                    </OverlayTrigger>
                  </Col>
                </Row>
              </Col>
              <Col sm={6}>
                <Row>
                  <Col>
                    <FloatingLabel label="Frames per histogram">
                      <Form.Control
                        type="text"
                        value={
                          triggerModeValue === 'hardware' && adTriggerModeValue === 'continuous'
                            ? '-'
                            : acquisitionData?.config?.trigger?.frames_per_timeframe
                        }
                        readOnly
                        style={floatingLabelStyle}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <FloatingLabel label="Total Storage">
                      <Form.Control
                        type="text"
                        value={acquisitionData?.config?.estimated_data_rate * est_duration + ' GB'}
                        readOnly
                        style={floatingLabelStyle}
                        className={rateTooHigh ? 'border border-danger text-danger bg-danger bg-opacity-10' : ''}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
              </Col>
            </Row>
          </TitleCard>
        </Col>

        {/* Acquisition Status */}
        <Col md={6}>
          <Card className="mt-3">
            <Card.Header><strong>Acquisition Status</strong></Card.Header>
            <Card.Body>
              {/* File Name */}
              <Row>
                <Col>
                  <FloatingLabel 
                    label="File Name (without .h5 extension)">
                      <EndpointInput
                        endpoint={acquisitionEndpoint} fullpath="state/acquisition/file_name"
                        style={floatingInputStyle}
                      />
                  </FloatingLabel>
                </Col>
              </Row>
              <Row classname="mt-2">
                <Col>
                  <EndpointCheckbox
                    endpoint={acquisitionEndpoint} fullpath="state/acquisition/add_timestamp"
                    label="Add timestamp to file"
                  />
                </Col>
              </Row>

              {/* (File Path) */}
              <Row className="mt-3">
                <Col>
                  <FloatingLabel 
                    label="File Path">
                      <EndpointInput
                        endpoint={acquisitionEndpoint} fullpath="state/acquisition/file_path"
                        style={floatingInputStyle}
                      />
                  </FloatingLabel>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col>
                  <Form.Label>Acquisition Progress</Form.Label>
                  <ProgressBar
                    now={acquisitionProgress ?? 0}
                    label={acquisitionProgressLabel}
                    variant={acquisitionProgress === 100 ? 'success' : undefined}
                  />
                </Col>
              </Row>
              <Row className="mt-3">
                <Col>
                  <EndpointButton
                    endpoint={acquisitionEndpoint}
                    fullpath="state/acquisition/toggle"
                    variant={acquisitionButtonVariant}
                    value={acquisitionEndpoint?.data?.state?.acquisition?.toggle ? false : true}
                    className="w-100"
                    disabled={acquisitionButtonDisabled}
                  >
                    {acquisitionEndpoint?.data?.state?.acquisition?.toggle ? 'Stop acquisition' : 'Start acquisition'}
                  </EndpointButton>
                  {rateTooHigh && (
                    <div className="text-danger mt-2">
                      Estimated data rate exceeds network capacity (12.5 GB/s). Increase frames per timeframe or reduce the bin count via bin mode on the Configuration page.
                    </div>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Acquisition;
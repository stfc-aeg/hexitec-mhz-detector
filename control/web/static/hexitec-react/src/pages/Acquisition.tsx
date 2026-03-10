import { Container, Row, Col, Card, Form, Button, ProgressBar, FloatingLabel, ToggleButton, ButtonGroup } from 'react-bootstrap';
import { useState } from 'react';
import { EndpointInput, useAdapterEndpoint, TitleCard } from 'odin-react';
import { floatingInputStyle, checkNullNoDp } from '../utils.js'
import type { AcquisitionTypes, MunirTypes } from '../EndpointTypes';

interface AcquisitionProps {
  endpoint_url: string;
}

function Acquisition({ endpoint_url }: AcquisitionProps) {

  const munirEndpoint = useAdapterEndpoint<MunirTypes>('munir', endpoint_url, 500);
  const acquisitionEndpoint = useAdapterEndpoint<AcquisitionTypes>('acquisition', endpoint_url, 500);
  // console.log(munirEndpoint?.data?.subsystems?.hexitec_mhz?.args)

  const [triggerModeValue, setTriggerModeValue] = useState('hardware');
  const [adTriggerModeValue, setAdTriggerModeValue] = useState('burst');
  const triggerModeRadios = [
    { name: 'Hardware', value: 'hardware' },
    { name: 'Software', value: 'software' }
  ];
  const adTriggerModeRadios = [
    { name: 'Burst',  value: 'burst' },
    { name: 'Continuous', value: 'continuous' },
    { name: 'Step scan', value: 'step_scan' }
  ];

  const handleTriggerModeChange = (value: string) => {
    setTriggerModeValue(value);
    let sendVal = {['device']: value};
    acquisitionEndpoint.put(sendVal, 'config/trigger');
  }

  const handleAdTriggerModeChange = (value: string) => {
    setAdTriggerModeValue(value);
    let sendVal = {['trigger_mode']: value};
    acquisitionEndpoint.put(sendVal, 'config/trigger');
  }

  return (
    <Container>
      <Row>
        {/* Trigger Settings */}
        <Col md={6} className="mt-3">
          <TitleCard title={<strong>Trigger Settings</strong>}>
            <Row>
              <ButtonGroup>
                {triggerModeRadios.map((radio, idx) => (
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
                ))}
              </ButtonGroup>
              {/* Show AD trigger mode options if hardware trigger mode is selected. needs centering */}
              {triggerModeValue==='hardware' ? (
                <Col>
                  <Row className="mt-3">
                    <ButtonGroup>
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
                  <Row>
                    {adTriggerModeValue === 'burst' && (
                      <>
                        <Col className="mt-3">
                          <FloatingLabel label="Timeframes per trigger">
                            <EndpointInput
                              endpoint={acquisitionEndpoint} fullpath="config/trigger/number_of_timeframes"
                              type="number"
                              style={floatingInputStyle}
                            />
                          </FloatingLabel>
                        </Col>
                        <Col className="mt-3">
                          <FloatingLabel label="Frames per timeframe">
                            <EndpointInput
                              endpoint={acquisitionEndpoint} fullpath="config/trigger/frames_per_timeframe"
                              type="number"
                              style={floatingInputStyle}
                            />
                          </FloatingLabel>
                        </Col>
                      </>
                    )}
                    {adTriggerModeValue === 'continuous' && (
                      <Col className="mt-3">
                        <p>In continuous mode, the detector acquires frames continuously, assigned to the current histogram time frame until the next trigger is received. Acquisition continues until end or aborted.</p>
                      </Col>
                    )}
                    {adTriggerModeValue === 'step_scan' && (
                      <>
                        <Col className="mt-3">
                          <FloatingLabel label="Frames per timeframe">
                            <EndpointInput
                              endpoint={acquisitionEndpoint} fullpath="config/trigger/frames_per_timeframe"
                              type="number"
                              style={floatingInputStyle}
                            />
                          </FloatingLabel>
                        </Col>
                        <Col className="mt-3">
                          <p>In step scan mode, the detector will acquire a set number of frames (input) each time it receives a trigger. The detector will wait for the next trigger before acquiring the next set of frames.</p>
                        </Col>
                      </>
                    )}
                  </Row>
                </Col>
              ) : (
                // show software trigger options if software trigger mode is selected: # timeframes, and frames per timeframe
                <Col>
                  <Row>
                    <Col className="mt-3">
                      <FloatingLabel label="# Timeframes">
                        <EndpointInput
                          endpoint={acquisitionEndpoint} fullpath="config/trigger/number_of_timeframes"
                          type="number"
                          style={floatingInputStyle}
                        />
                      </FloatingLabel>
                    </Col>
                    <Col className="mt-3">
                      <FloatingLabel label="Frames per timeframe">
                        <EndpointInput
                          endpoint={acquisitionEndpoint} fullpath="config/trigger/frames_per_timeframe"
                          type="number"
                          style={floatingInputStyle}
                        />
                      </FloatingLabel>
                    </Col>
                  </Row>
                </Col>
              )}
            </Row>
            <Row className="mt-3">
              <label>Summary goes here</label>
            </Row>
          </TitleCard>

        </Col>

        {/* Acquisition Status */}
        <Col md={6}>
          <Card className="mt-3">
            <Card.Header><strong>Acquisition Status</strong></Card.Header>
            <Card.Body>
              {/* Acquisition Length (frames) */}
              <Row className="mb-3">
                <Col>
                  <FloatingLabel 
                    label="Acquisition length (seconds)">
                      <EndpointInput
                        endpoint={munirEndpoint} fullpath="subsystems/hexitec_mhz/args/num_frames"  // frames length
                        type="number"
                        style={floatingInputStyle}
                      />
                  </FloatingLabel>
                  <Form.Text>Est. {checkNullNoDp(munirEndpoint?.data.subsystems?.hexitec_mhz.args.num_frames*1000000).toLocaleString()} frames</Form.Text>
                </Col>
              </Row>
              {/* File Name */}
              <Row className="mb-3">
                <Col>
                  <FloatingLabel 
                    label="File Name (without .h5 extension)">
                      <EndpointInput
                        endpoint={munirEndpoint} fullpath="subsystems/hexitec_mhz/args/file_name"
                        type="text"
                        style={floatingInputStyle}
                      />
                  </FloatingLabel>

                </Col>
              </Row>

              {/* (File Path) */}
              <Row className="mb-3">
                <Col>
                  <FloatingLabel 
                    label="File Path">
                      <EndpointInput
                        endpoint={munirEndpoint} fullpath="subsystems/hexitec_mhz/args/file_path"
                        type="text"
                        style={floatingInputStyle}
                      />
                  </FloatingLabel>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col>
                  <Form.Label>Acquisition Progress</Form.Label>
                  <ProgressBar now={0} label="0%" />
                </Col>
              </Row>
              <Row className="mb-3">
                <Col>
                  <Form.Label>Estimated File Size</Form.Label>
                  <Form.Control type="text" value="0 MB" readOnly />
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={6}>
                  <Button variant="success" className="w-100">
                    Start Acquisition
                  </Button>
                </Col>
                <Col sm={6}>
                  <Button variant="danger" className="w-100">
                    Stop Acquisition
                  </Button>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col>
                  <Button variant="warning" className="w-100">
                    Freeze Histogram
                  </Button>
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
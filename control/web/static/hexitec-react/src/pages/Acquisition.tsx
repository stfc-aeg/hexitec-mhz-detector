import { Container, Row, Col, Card, Form, Button, ProgressBar, FloatingLabel, ToggleButton, ButtonGroup } from 'react-bootstrap';
import { useState } from 'react';
import { WithEndpoint, EndpointInput, useAdapterEndpoint, TitleCard } from 'odin-react';
import { floatingInputStyle, floatingLabelStyle } from '../utils.js'
import type { AcquisitionTypes, MunirTypes, MetadataType } from '../EndpointTypes';

interface AcquisitionProps {
  endpoint_url: string;
}

const EndpointButton = WithEndpoint(Button);
const EndpointSelect = WithEndpoint(Form.Select);

function Acquisition({ endpoint_url }: AcquisitionProps) {

  const munirEndpoint = useAdapterEndpoint<MunirTypes>('munir', endpoint_url, 500);
  const acquisitionEndpoint = useAdapterEndpoint<AcquisitionTypes>('acquisition', endpoint_url, 1000);
  const acquisitionData = acquisitionEndpoint?.data;


  const acquisitionMetadata = acquisitionEndpoint?.metadata as AcquisitionTypes|undefined;
  const binmode_metadata = acquisitionMetadata?.config?.bin_mode as MetadataType|undefined;

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

  const est_duration = ((acquisitionData?.config?.trigger?.frames_per_timeframe * acquisitionData?.config?.trigger?.number_of_timeframes) / 1000000);

  return (
    <Container>
      <Row>
        {/* Trigger Settings */}
        <Col md={6} className="mt-3">
          <TitleCard title={<strong>Trigger Settings</strong>}>
            <Row>
              <Col>
                <FloatingLabel
                  label="Bin Mode">
                  <EndpointSelect
                    endpoint={acquisitionEndpoint}
                    fullpath="config/bin_mode"
                    variant="outline-secondary"
                    buttonText={acquisitionData?.config?.bin_mode}
                    style={floatingInputStyle}>
                      {(binmode_metadata?.allowed_values ?? ['?']).map(
                        (selection, index) => (
                          <option value={selection} key={index}>{selection}</option>
                        )
                      )}
                  </EndpointSelect>
                </FloatingLabel>
              </Col>
            </Row>
            <Row className="mt-3">
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
              <label><strong>Summary</strong></label>
            </Row>
            <Row className="mt-3">
              <Col sm={6}>
                <Row>
                  <Col>
                    <FloatingLabel label="# Histograms">
                      <Form.Control
                        type="text"
                        value={
                          triggerModeValue==='hardware' 
                            ? acquisitionData?.config?.trigger?.number_of_timeframes.toString() + ' per trigger'
                            : acquisitionData?.config?.trigger?.number_of_timeframes}
                        readOnly
                        style={floatingLabelStyle}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <FloatingLabel label="Est. Duration (s)">
                      <Form.Control
                        type="text"
                        value={
                          triggerModeValue==='hardware' ? est_duration.toString() + ' per trigger' : est_duration}
                        readOnly
                        style={floatingLabelStyle}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
              </Col>
              <Col sm={6}>
                <Row>
                  <Col>
                    <FloatingLabel label="Frames per histogram">
                      <Form.Control
                        type="text"
                        value={acquisitionData?.config?.trigger?.frames_per_timeframe}
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
                        value={false}
                        readOnly
                        style={floatingLabelStyle}
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
                <Col>
                  <EndpointButton
                    endpoint={acquisitionEndpoint}
                    fullpath={acquisitionEndpoint?.data.acquisition?.acquiring ? "acquisition/stop" : "acquisition/start"}
                    variant={acquisitionEndpoint?.data.acquisition?.acquiring ? "danger" : "primary"}
                    value={true}
                    className="w-100"
                  >
                    {acquisitionEndpoint?.data.acquisition?.acquiring ? 'Stop acquisition' : 'Start acquisition'}
                  </EndpointButton>
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
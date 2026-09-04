import { useState } from 'react';
import { EndpointButton, EndpointCheckbox, EndpointDropdown, TitleCard, WithEndpoint, OdinGraph, useAdapterEndpoint } from '@dssg/odin-react';
import { Col, Container, Form, InputGroup, Row, Stack, Dropdown, Spinner, FloatingLabel } from 'react-bootstrap';
// import Plot from 'react-plotly.js';
import type { ProxyParams } from '../EndpointTypes';
import {floatingInputStyle, floatingLabelStyle} from '../utils.js';

interface LokiExtraProps {
  endpoint_url: string;
}

const EndpointSelect = WithEndpoint(Form.Select);

function LokiExtra({ endpoint_url }: LokiExtraProps) {
  const proxyEndpoint = useAdapterEndpoint<ProxyParams>('proxy', endpoint_url, 1000);
  const loki = proxyEndpoint.data?.loki;
  const application = loki?.application;
  const asicSettings = application?.asic_settings;
  const calibrationPattern = asicSettings?.calibration_pattern;
  const preset = calibrationPattern?.MODES?.PRESET;
  const [vcal, setVcal] = useState<number>(0);

  let image_request_state = asicSettings?.segment_readout?.REQUEST;
  let current_segment = asicSettings?.segment_readout?.SEGMENT_SELECT;

  const vcalValue = application?.vcal;
  const calibrationModes = calibrationPattern?.MODES
    ? Object.keys(calibrationPattern.MODES).filter((mode) => mode !== 'PRESET')
    : [];


  let fakedata = [
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
        ];

  return (
    <Container fluid>
      <Row className="g-3">
        <Col>
          <TitleCard title={<strong>SPI Readout</strong>}>
          <Row>
		        <Col>
              <InputGroup>
                <InputGroup.Text>Choose segment:</InputGroup.Text>
                  <EndpointDropdown endpoint={proxyEndpoint} fullpath="loki/application/asic_settings/segment_readout/SEGMENT_SELECT" variant="primary">
			              <Dropdown.Item eventKey={20}>All Segments</Dropdown.Item>
			              {Array.from({ length: 20 }, (_, i) => (
			        	      <Dropdown.Item eventKey={i}>Segment {i}</Dropdown.Item>
			              ))}
			          </EndpointDropdown>
              </InputGroup>
			      </Col>
			      <Col>
			        <EndpointButton endpoint={proxyEndpoint} fullpath="loki/application/asic_settings/segment_readout/REQUEST" value={true} variant={!image_request_state ? "success" : "outline-primary"}>
			        	{image_request_state && <Spinner animation="border" size="sm" />}
			        	New Image
			        </EndpointButton>
			      </Col>
          </Row>
          <Row>
            <Col hidden={image_request_state}>
              <OdinGraph
                title="HEXITEC-MHz Sensor SPI Readback"
			          type='heatmap'
			          data={asicSettings?.segment_readout?.SEGMENT_DATA ?? [0]}
			          colorscale='Viridis'
			          layout={{height:900}}
              />
            </Col>
          </Row>
          </TitleCard>
        </Col>
      </Row>
      <Row>
        <Col>
          <TitleCard title={<strong>VCAL Input</strong>}>
			    <Row>
			      <Col md="auto">
			        <FloatingLabel label="Current VCAL">
                <Form.Control
                  plaintext
                  readOnly
                  style={floatingLabelStyle}
                  value={application?.vcal + " v"}
                />
				    </FloatingLabel>
            </Col>
			      <Col>
              <InputGroup>
                <InputGroup.Text>VCAL</InputGroup.Text>
                <Form.Control
                  type="number"
                  value={vcal}
                  placeholder={application?.vcal?.toString() ?? ''}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setVcal(Number(value));
                  }}
                />
                <InputGroup.Text>V</InputGroup.Text>
                <EndpointButton
                  endpoint={proxyEndpoint}
                  fullpath="loki/application/vcal"
                  value={vcalValue}
                  disabled={vcalValue === undefined}
                >
                  Set
                </EndpointButton>
              </InputGroup>
			      </Col>
			    </Row>
          </TitleCard>
        </Col>
      </Row>
      <Row>
        <Col>
          <TitleCard title={<strong>Test Pattern</strong>}>
          {!asicSettings ? (
            <p className="text-muted mb-0">ASIC settings are unavailable.</p>
          ) : (
            <Stack gap={3}>
              <Row className="g-3 align-items-end">
                <Col md={4}>
                  <EndpointCheckbox
                    endpoint={proxyEndpoint}
                    fullpath="loki/application/asic_settings/calibration_pattern/ENABLE"
                    label="Calibration Pattern Enable"
                  />
                </Col>
                <Col md={4}>
                  <FloatingLabel label="Mode">
                    <EndpointSelect
                      endpoint={proxyEndpoint}
                      fullpath="loki/application/asic_settings/calibration_pattern/MODE"
                      value={calibrationPattern?.MODE ?? ''}
                      style={floatingInputStyle}
                    >
                      {calibrationModes.map((mode) => (
                        <option value={mode} key={mode}>{mode}</option>
                      ))}
                    </EndpointSelect>
                  </FloatingLabel>
                </Col>
                <Col md={4}>
                  <FloatingLabel label="Preset">
                    <EndpointSelect
                      endpoint={proxyEndpoint}
                      fullpath="loki/application/asic_settings/calibration_pattern/MODES/PRESET/SELECT"
                      value={preset?.SELECT ?? ''}
                      style={floatingInputStyle}
                    >
                      {(preset?.AVAIL ?? []).map((presetName) => (
                        <option value={presetName} key={presetName}>{presetName}</option>
                      ))}
                    </EndpointSelect>
                  </FloatingLabel>
                </Col>
              </Row>
            </Stack>
          )}
          </TitleCard>
        </Col>
      </Row>
    </Container>
  );
}

export default LokiExtra;

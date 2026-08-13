import { Row, Col, Card, Form, InputGroup, FloatingLabel, Accordion } from 'react-bootstrap';
import { UserAware } from '../UserAware';
import { WithEndpoint, type AdapterEndpoint } from 'odin-react';
import { floatingInputStyle } from '../../utils.js';
import { OverlayTrigger } from 'react-bootstrap';
import { tooltips } from '../../tooltips';
import type { AcquisitionTypes, HistogramTypes } from '../../EndpointTypes';

interface ProcessingProps {
  histogramEndpoint: AdapterEndpoint<HistogramTypes>;
  acquisitionEndpoint: AdapterEndpoint<AcquisitionTypes>;
  isCustom: boolean;
}

const EndpointFormControl = WithEndpoint(Form.Control);
const EndpointCheck = WithEndpoint(Form.Check);
const EndpointSelect = WithEndpoint(Form.Select);

export default function Processing( {histogramEndpoint, acquisitionEndpoint, isCustom }: ProcessingProps) {

  const histogramMetadata = histogramEndpoint.metadata;
  const autoTrigModeOptions = histogramMetadata?.config?.clustering?.auto_trig_mode?.allowed_values;
  const modeOptions = histogramMetadata?.config?.clustering?.mode?.allowed_values;

  const acquisitionData = acquisitionEndpoint?.data;

  // If an acquisition is happening, the histogrammer will not let you change settings
  // The UI should make it obvious this is what is occurring
  // In future, some handling for in-preview as opposed to in-acquisition, but this will reuqire some consideration
  const isAcquiring = acquisitionData?.state?.acquisition?.toggle || acquisitionData?.state?.preview?.toggle;

  // Ordered for grouping: horizontal, vertical, diag1, diag2, quad/all/lone, L1-L4
  const clusterTypeOrder = [
    'HOZ', 'HOZ_NL', 'HOZ_NR',
    'VERT', 'VERT_NA', 'VERT_NB',
    'DIAG1', 'DIAG1NL', 'DIAG1NR',
    'DIAG2', 'DIAG2NL', 'DIAG2NR',
    'QUAD', 'ALL', 'LONE',
    'L1', 'L2', 'L3', 'L4'
  ];

  const clusterTypeLabels: { [key: string]: string } = {
    'ALL': 'All',
    'DIAG1': 'Diagonal 1',
    'DIAG1NL': 'D.1 No Left',
    'DIAG1NR': 'D.1 No Right',
    'DIAG2': 'Diagonal 2',
    'DIAG2NL': 'D.2 No Left',
    'DIAG2NR': 'D.2 No Right',
    'HOZ': 'Horizontal',
    'HOZ_NL': 'Horiz. No Left',
    'HOZ_NR': 'Horiz. No Right',
    'L1': 'L1',
    'L2': 'L2',
    'L3': 'L3',
    'L4': 'L4',
    'LONE': 'Lone',
    'QUAD': 'Quad',
    'VERT': 'Vertical',
    'VERT_NA': 'Vert. No Above',
    'VERT_NB': 'Vert. No Below'
  };

  return (
    <Card className="mt-3">
      <Card.Header><strong>Processing</strong></Card.Header>
      <Card.Body>
        <Row>
          <Col>
            <Form.Label><b>Charge-sharing Options</b></Form.Label>
            <Row>
              <Col>
                <EndpointCheck
                  endpoint={histogramEndpoint}
                  fullpath="config/charge_sharing/positive_edge"
                  type="switch"
                  label="Positive Edge"
                  disabled={!isCustom || isAcquiring}
                />
              </Col>
              <Col>
                <EndpointCheck
                  endpoint={histogramEndpoint}
                  fullpath="config/charge_sharing/sum_enable"
                  type="switch"
                  label="Sum Enable"
                  disabled={!isCustom || isAcquiring}
                />
              </Col>
            </Row>
            <Row className="mb-3">
              <Col>
                <EndpointCheck
                  endpoint={histogramEndpoint}
                  fullpath="config/charge_sharing/negative_neighbour"
                  type="switch"
                  label="Negative Neighbour"
                  disabled={!isCustom || isAcquiring}
                />
              </Col>
              <Col>
                <EndpointCheck
                  endpoint={histogramEndpoint}
                  fullpath="config/charge_sharing/position_adjust"
                  type="switch"
                  label="Position Adjust"
                  disabled={!isCustom || isAcquiring}
                />
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Label><b>Clustering</b></Form.Label>
            <Row>
              <Col>
                <Row>
                  <Col>
                    <FloatingLabel label="Auto Trigger Mode">
                      <EndpointSelect
                        endpoint={histogramEndpoint}
                        fullpath="config/clustering/auto_trig_mode"
                        disabled={!isCustom || isAcquiring}
                        >
                          {autoTrigModeOptions?.map((option: string) => (
                            <option value={option} key={option}>{option}</option>
                          ))}
                      </EndpointSelect>
                    </FloatingLabel>
                  </Col>
                  <Col>
                    <FloatingLabel label="Mode">
                      <EndpointSelect
                        endpoint={histogramEndpoint}
                        fullpath="config/clustering/mode"
                        disabled={!isCustom || isAcquiring}
                        >
                          {modeOptions?.map((option: string) => (
                            <option value={option} key={option}>{option}</option>
                          ))}
                      </EndpointSelect>
                    </FloatingLabel>
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col>
                    <Accordion defaultActiveKey="1">
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>Cluster types</Accordion.Header>
                        <Accordion.Body>
                          <Row>
                            {histogramMetadata?.config?.clustering?.types && clusterTypeOrder.map((typeKey: string) => (
                              <Col sm={6} md={4} key={typeKey}>
                                <EndpointCheck
                                  endpoint={histogramEndpoint}
                                  fullpath={`config/clustering/types/${typeKey}`}
                                  type="switch"
                                  label={clusterTypeLabels[typeKey] || typeKey}
                                  disabled={!isCustom || isAcquiring}
                                />
                              </Col>
                            ))}
                          </Row>
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Col>
        </Row>

        <UserAware userLevel="power">
          <Row className="mt-3">
            <Col>
              <Form.Label><b>Dark Tracking / Baseline Load</b></Form.Label>
              <Row className="mb-3">
                <OverlayTrigger placement="top" overlay={tooltips.processing.baseline_toggle}>
                  <Col>
                    <EndpointCheck
                      endpoint={acquisitionEndpoint}
                      fullpath="config/baseline/toggle"
                      label="On"
                      type="switch"
                      disabled={!isCustom || isAcquiring}
                    />
                  </Col>
                </OverlayTrigger>
                <Col>
                  <EndpointCheck
                    endpoint={histogramEndpoint}
                    fullpath="config/baseline/dither"
                    label="Dither"
                    type="switch"
                    disabled={!isCustom || isAcquiring}
                  />
                </Col>
              </Row>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Label><b>Thresholds Global</b></Form.Label>
              <InputGroup>
                <InputGroup.Text className="fw-semibold justify-content-center" style={{width:'20%'}}>Main</InputGroup.Text>
                <FloatingLabel label="Negative">
                  <EndpointFormControl
                    endpoint={histogramEndpoint}
                    fullpath="config/thresholds/main/neg"
                    style={floatingInputStyle}
                    disabled={!isCustom || isAcquiring}
                  />
                </FloatingLabel>
                <FloatingLabel label="Positive">
                  <EndpointFormControl
                    endpoint={histogramEndpoint}
                    fullpath="config/thresholds/main/pos"
                    style={floatingInputStyle}
                    disabled={!isCustom || isAcquiring}
                  />
                </FloatingLabel>
              </InputGroup>
              <Accordion defaultActiveKey="1">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Low and Absolute Thresholds</Accordion.Header>
                  <Accordion.Body>
                    <InputGroup>
                      <InputGroup.Text className="fw-semibold justify-content-center" style={{width:'20%'}}>Low</InputGroup.Text>
                      <FloatingLabel label="Negative">
                        <EndpointFormControl
                          endpoint={histogramEndpoint}
                          fullpath="config/thresholds/low/neg"
                          style={floatingInputStyle}
                          disabled={!isCustom || isAcquiring}
                        />
                      </FloatingLabel>
                      <FloatingLabel label="Positive">
                        <EndpointFormControl
                          endpoint={histogramEndpoint}
                          fullpath="config/thresholds/low/pos"
                          style={floatingInputStyle}
                          disabled={!isCustom || isAcquiring}
                        />
                      </FloatingLabel>
                    </InputGroup>
                    <InputGroup>
                      <InputGroup.Text className="fw-semibold justify-content-center" style={{width:'20%'}}>Absolute</InputGroup.Text>
                      <FloatingLabel label="Low">
                        <EndpointFormControl
                          endpoint={histogramEndpoint}
                          fullpath="config/thresholds/absolute/low"
                          style={floatingInputStyle}
                          disabled={!isCustom || isAcquiring}
                        />
                      </FloatingLabel>
                      <FloatingLabel label="High">
                        <EndpointFormControl
                          endpoint={histogramEndpoint}
                          fullpath="config/thresholds/absolute/high"
                          style={floatingInputStyle}
                          disabled={!isCustom || isAcquiring}
                        />
                      </FloatingLabel>
                    </InputGroup>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Col>
          </Row>
        </UserAware>
      </Card.Body>
    </Card>
  );
}

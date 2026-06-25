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
}

const EndpointFormControl = WithEndpoint(Form.Control);
const EndpointCheck = WithEndpoint(Form.Check);
const EndpointSelect = WithEndpoint(Form.Select);

export default function Processing( {histogramEndpoint, acquisitionEndpoint }: ProcessingProps) {

  const histogramMetadata = histogramEndpoint.metadata;
  const autoTrigModeOptions = histogramMetadata?.config?.clustering?.auto_trig_mode?.allowed_values;
  const modeOptions = histogramMetadata?.config?.clustering?.mode?.allowed_values;

  const acquisitionData = acquisitionEndpoint?.data;
  const acquisitionMetadata = acquisitionEndpoint?.metadata;
  const binmode_metadata = acquisitionMetadata?.config?.bin_mode;

  // Ordered for grouping: horizontal, vertical, diag1, diag2, quad/all/lone, L1-L4
  const clusterTypeOrder = [
    'hoz', 'hoz nl', 'hoz nr',
    'vert', 'vert na', 'vert nb',
    'diag1', 'diag1nl', 'diag1nr',
    'diag2', 'diag2nl', 'diag2nr',
    'quad', 'all', 'lone',
    'l1', 'l2', 'l3', 'l4'
  ];

  const clusterTypeLabels: { [key: string]: string } = {
    'all': 'All',
    'diag1': 'Diagonal 1',
    'diag1nl': 'D.1 No Left',
    'diag1nr': 'D.1 No Right',
    'diag2': 'Diagonal 2',
    'diag2nl': 'D.2 No Left',
    'diag2nr': 'D.2 No Right',
    'hoz': 'Horizontal',
    'hoz nl': 'Horiz. No Left',
    'hoz nr': 'Horiz. No Right',
    'l1': 'L1',
    'l2': 'L2',
    'l3': 'L3',
    'l4': 'L4',
    'lone': 'Lone',
    'quad': 'Quad',
    'vert': 'Vertical',
    'vert na': 'Vert. No Above',
    'vert nb': 'Vert. No Below'
  };

  // need to map histogram bin modes to numbers
  // labels are in form histogram_X where X is number of bins, but we only want '<number> bins' for dropdown
  const binModeOptions: { [key: string]: string } = {
    'histogram_128': '128 bins',
    'histogram_256': '256 bins',
    'histogram_512': '512 bins',
    'histogram_1024': '1024 bins',
    'histogram_2048': '2048 bins',
    'histogram_4096': '4096 bins'
  };
  

  return (
    <Card className="mt-3">
      <Card.Header><strong>Processing</strong></Card.Header>
      <Card.Body>
        <Row>
          <Col>
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
                          <option value={selection} key={index}>{binModeOptions[selection] || selection}</option>
                        )
                      )}
                  </EndpointSelect>
                </FloatingLabel>
              </Col>
            </Row>
            <Form.Label className="mt-3"><b>Charge-sharing Options</b></Form.Label>
            <Row>
              <Col>
                <EndpointCheck
                  endpoint={histogramEndpoint}
                  fullpath="config/charge_sharing/positive_edge"
                  type="switch"
                  label="Positive Edge"
                />
              </Col>
              <Col>
                <EndpointCheck
                  endpoint={histogramEndpoint}
                  fullpath="config/charge_sharing/sum_enable"
                  type="switch"
                  label="Sum Enable"
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
                />
              </Col>
              <Col>
                <EndpointCheck
                  endpoint={histogramEndpoint}
                  fullpath="config/charge_sharing/position_adjust"
                  type="switch"
                  label="Position Adjust"
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
                      label="On/off"
                      type="switch"
                    />
                  </Col>
                </OverlayTrigger>
                <Col>
                  <EndpointCheck
                    endpoint={histogramEndpoint}
                    fullpath="config/baseline/dither"
                    label="Dither"
                    type="switch"
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
                  />
                </FloatingLabel>
                <FloatingLabel label="Positive">
                  <EndpointFormControl
                    endpoint={histogramEndpoint}
                    fullpath="config/thresholds/main/pos"
                    style={floatingInputStyle}
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
                        />
                      </FloatingLabel>
                      <FloatingLabel label="Positive">
                        <EndpointFormControl
                          endpoint={histogramEndpoint}
                          fullpath="config/thresholds/low/pos"
                          style={floatingInputStyle}
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
                        />
                      </FloatingLabel>
                      <FloatingLabel label="High">
                        <EndpointFormControl
                          endpoint={histogramEndpoint}
                          fullpath="config/thresholds/absolute/high"
                          style={floatingInputStyle}
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

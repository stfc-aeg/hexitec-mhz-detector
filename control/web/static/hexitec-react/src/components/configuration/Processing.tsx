import { Row, Col, Card, Form, InputGroup, FloatingLabel, Accordion } from 'react-bootstrap';
import { UserAware } from '../UserAware';
import { WithEndpoint } from 'odin-react';
import { floatingInputStyle } from '../../utils.js';
import type { MetadataType } from '../../EndpointTypes';
import { FilePicker } from '../FilePicker';

interface ProcessingProps {
  histogramEndpoint: any;
}

const EndpointFormControl = WithEndpoint(Form.Control);
const EndpointCheck = WithEndpoint(Form.Check);

export default function Processing( {histogramEndpoint}: ProcessingProps) {
    
  const histogramMetadata = histogramEndpoint.metadata;
  const l3file_metadata = histogramMetadata?.config?.charge_sharing?.l3_filename as MetadataType | undefined;
  const posfile_metadata = histogramMetadata?.config?.charge_sharing?.mc_filename as MetadataType | undefined;
  const mcfile_metadata = histogramMetadata?.config?.charge_sharing?.pos_filename as MetadataType | undefined;

  return (
    <Card className="mt-3">
      <Card.Header><strong>Processing</strong></Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Col>
            <Form.Label><b>Charge-sharing Options</b></Form.Label>
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
            <Accordion defaultActiveKey="0" className="mb-3" >
              <Accordion.Item eventKey="0">
                <Accordion.Header>Charge Share File Uploads</Accordion.Header>
                <Accordion.Body>
                  <Row className="mb-2">
                    <Form.Label>L3 File load</Form.Label>
                    <FilePicker
                      endpoint={histogramEndpoint}
                      fullpath="config/charge_sharing/l3_filename"
                      buttonText={histogramEndpoint.data?.config?.charge_sharing?.l3_filename}
                      param_metadata={l3file_metadata}
                      loadButton
                      loadPath="config/charge_sharing/l3_load"
                    />
                  </Row>
                  <Row className="mb-2">
                    <Form.Label>MC File load</Form.Label>
                    <FilePicker
                      endpoint={histogramEndpoint}
                      fullpath="config/charge_sharing/mc_filename"
                      buttonText={histogramEndpoint.data?.config?.charge_sharing?.mc_filename}
                      param_metadata={mcfile_metadata}
                      loadButton
                      loadPath="config/charge_sharing/mc_load"
                    />
                  </Row>
                  <Row className="mb-2">
                    <Form.Label>Pos File load</Form.Label>
                    <FilePicker
                      endpoint={histogramEndpoint}
                      fullpath="config/charge_sharing/pos_filename"
                      buttonText={histogramEndpoint.data?.config?.charge_sharing?.pos_filename}
                      param_metadata={posfile_metadata}
                      loadButton
                      loadPath="config/charge_sharing/pos_load"
                    />
                  </Row>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Col>
        </Row>

        <UserAware userLevel="power">
          <Row className="mb-3">
            <Col>
              <Form.Label><b>Dark Tracking / Baseline Load</b></Form.Label>
              <Row className="mb-3">
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

import React from 'react';
import { Container, Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import { UserAware } from '../components/UserAware';

interface CameraControlProps {
  endpoint_url: string;
}

function CameraControl({ endpoint_url }: CameraControlProps) {
  return (
    <Container>
      <Row>
        {/* Power and Environmental Controls */}
        <Col md={6}>
          <Card className="mb-3">
            <Card.Header><strong>Power & Environmental</strong></Card.Header>
            <Card.Body>
              <UserAware userLevel="basic" endpoint_url={endpoint_url}>
                <Row className="mb-3">
                  <Col sm={6}>
                    <Form.Label>HV Bias</Form.Label>
                    <Form.Check type="switch" id="hv-bias" label="Off" />
                  </Col>
                  <Col sm={6}>
                    <Form.Label>HV Reading</Form.Label>
                    <Form.Control type="text" value="0 V" readOnly />
                  </Col>
                </Row>
              </UserAware>

              <UserAware userLevel="power" endpoint_url={endpoint_url}>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>HV Value</Form.Label>
                    <Form.Control type="number" placeholder="0" />
                    <Form.Text className="text-muted">Bias value (V)</Form.Text>
                  </Col>
                </Row>
              </UserAware>

              <UserAware userLevel="basic" endpoint_url={endpoint_url}>
                <Row className="mb-3">
                  <Col sm={6}>
                    <Form.Label>Peltier</Form.Label>
                    <Form.Check type="switch" id="peltier" label="Off" />
                  </Col>
                  <Col sm={6}>
                    <Form.Label>Dew Point Warning</Form.Label>
                    <div>
                      <Badge bg="success">OK</Badge>
                    </div>
                  </Col>
                </Row>
              </UserAware>

              <UserAware userLevel="power" endpoint_url={endpoint_url}>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Peltier Setpoint</Form.Label>
                    <Form.Select>
                      <option value="25">25%</option>
                      <option value="50" selected>50%</option>
                      <option value="75">75%</option>
                      <option value="100">100%</option>
                    </Form.Select>
                  </Col>
                </Row>
              </UserAware>

              <UserAware userLevel="basic" endpoint_url={endpoint_url}>
                <Row className="mb-3">
                  <Col sm={6}>
                    <Form.Label>Humidity Reading</Form.Label>
                    <Form.Control type="text" value="45%" readOnly />
                  </Col>
                  <Col sm={6}>
                    <Form.Label>Temperature Reading</Form.Label>
                    <Form.Control type="text" value="22°C" readOnly />
                  </Col>
                </Row>
              </UserAware>
            </Card.Body>
          </Card>
        </Col>

        {/* Detector Controls */}
        <Col md={6}>
          <Card className="mb-3">
            <Card.Header><strong>Detector Controls</strong></Card.Header>
            <Card.Body>
              <UserAware userLevel="basic" endpoint_url={endpoint_url}>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Gain Stage</Form.Label>
                    <Form.Select>
                      <option value="low">Low</option>
                      <option value="mid">Mid</option>
                      <option value="high" selected>High</option>
                    </Form.Select>
                  </Col>
                </Row>
              </UserAware>

              <UserAware userLevel="power" endpoint_url={endpoint_url}>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Negative Dynamic Range</Form.Label>
                    <Form.Select>
                      <option value="low">Low</option>
                      <option value="high" selected>High</option>
                    </Form.Select>
                  </Col>
                </Row>
              </UserAware>

              <UserAware userLevel="basic" endpoint_url={endpoint_url}>
                <Row className="mb-3">
                  <Col sm={6}>
                    <Button variant="success" className="w-100">
                      Initialise Detector
                    </Button>
                  </Col>
                  <Col sm={6}>
                    <Button variant="danger" className="w-100">
                      Power Off Detector
                    </Button>
                  </Col>
                </Row>
              </UserAware>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default CameraControl;
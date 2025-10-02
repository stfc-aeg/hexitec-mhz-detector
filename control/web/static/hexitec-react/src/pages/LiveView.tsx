import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { UserAware } from '../components/UserAware';

interface LiveViewProps {
  endpoint_url: string;
}

function LiveView({ endpoint_url }: LiveViewProps) {
  return (
    <Container>
      <Row>
        {/* Live Images */}
        <Col md={8}>
          <UserAware userLevel="basic" endpoint_url={endpoint_url}>
            <Card className="mb-3">
              <Card.Header><strong>Live Counts Map</strong></Card.Header>
              <Card.Body>
                <div style={{ 
                  height: '400px', 
                  backgroundColor: '#f8f9fa', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px dashed #dee2e6'
                }}>
                  <span className="text-muted">80x80 Pixel Array Placeholder</span>
                </div>
                <Row className="mt-2">
                  <Col sm={4}>
                    <Button variant="outline-primary" size="sm">Zoom In</Button>
                  </Col>
                  <Col sm={4}>
                    <Button variant="outline-secondary" size="sm">Reset View</Button>
                  </Col>
                  <Col sm={4}>
                    <Button variant="outline-info" size="sm">Load Acquisition</Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header><strong>Live Histogram</strong></Card.Header>
              <Card.Body>
                <div style={{ 
                  height: '300px', 
                  backgroundColor: '#f8f9fa', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px dashed #dee2e6'
                }}>
                  <span className="text-muted">Histogram Placeholder</span>
                </div>
                <Row className="mt-2">
                  <Col sm={4}>
                    <Button variant="outline-primary" size="sm">Zoom In</Button>
                  </Col>
                  <Col sm={4}>
                    <Button variant="outline-secondary" size="sm">Reset View</Button>
                  </Col>
                  <Col sm={4}>
                    <Button variant="outline-success" size="sm">Restart Integration</Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </UserAware>
        </Col>

        {/* Controls */}
        <Col md={4}>
          <UserAware userLevel="basic" endpoint_url={endpoint_url}>
            <Card className="mb-3">
              <Card.Header><strong>Colormap Settings</strong></Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Scaling Mode</Form.Label>
                    <Form.Select>
                      <option value="linear" selected>Linear</option>
                      <option value="log">Log</option>
                    </Form.Select>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Form.Check type="checkbox" id="auto-limits" label="Auto Limits" defaultChecked />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={6}>
                    <Form.Control type="number" placeholder="Min" disabled />
                  </Col>
                  <Col sm={6}>
                    <Form.Control type="number" placeholder="Max" disabled />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Colormap</Form.Label>
                    <Form.Select>
                      <option value="greyscale" selected>Greyscale</option>
                      <option value="viridis">Viridis</option>
                      <option value="plasma">Plasma</option>
                      <option value="hot">Hot</option>
                    </Form.Select>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header><strong>ADU & ROI Settings</strong></Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col sm={6}>
                    <Form.Label>ADU Min</Form.Label>
                    <Form.Control type="number" defaultValue="0" />
                  </Col>
                  <Col sm={6}>
                    <Form.Label>ADU Max</Form.Label>
                    <Form.Control type="number" defaultValue="4096" />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Integration Length</Form.Label>
                    <Form.Range min="0.1" max="10" step="0.1" defaultValue="1" />
                    <Form.Text className="text-muted">1 s</Form.Text>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={6}>
                    <Form.Label>ROI Min</Form.Label>
                    <Form.Control type="number" defaultValue="0" />
                  </Col>
                  <Col sm={6}>
                    <Form.Label>ROI Max</Form.Label>
                    <Form.Control type="number" defaultValue="79" />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Update Interval</Form.Label>
                    <Form.Control type="number" defaultValue="1" />
                    <Form.Text className="text-muted">Hz</Form.Text>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header><strong>Histogram Settings</strong></Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Y Axis Scaling</Form.Label>
                    <Form.Select>
                      <option value="linear" selected>Linear</option>
                      <option value="log">Log</option>
                    </Form.Select>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Form.Check type="checkbox" id="y-auto-limits" label="Y Auto Limits" defaultChecked />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={6}>
                    <Form.Control type="number" placeholder="Y Min" disabled />
                  </Col>
                  <Col sm={6}>
                    <Form.Control type="number" placeholder="Y Max" disabled />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={6}>
                    <Form.Label>X Min</Form.Label>
                    <Form.Control type="number" defaultValue="0" />
                  </Col>
                  <Col sm={6}>
                    <Form.Label>X Max</Form.Label>
                    <Form.Control type="number" defaultValue="4096" />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </UserAware>
        </Col>
      </Row>
    </Container>
  );
}

export default LiveView;
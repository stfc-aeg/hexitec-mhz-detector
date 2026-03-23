import { Row, Col, Card, Form, Button } from 'react-bootstrap';
import { UserAware } from '../UserAware';

export default function DetectorControls() {
  return (
    <Card className="mt-3">
      <Card.Header><strong>Detector Controls</strong></Card.Header>
      <Card.Body>
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

        <UserAware userLevel="power" as={Row} className="mb-3">
          <Col>
            <Form.Label>Negative Dynamic Range</Form.Label>
            <Form.Select>
              <option value="low">Low</option>
              <option value="high" selected>High</option>
            </Form.Select>
          </Col>
        </UserAware>

        <Row className="mb-3">
          <Col sm={6}>
            <Button variant="success" className="w-100">Initialise Detector</Button>
          </Col>
          <Col sm={6}>
            <Button variant="danger" className="w-100">Power Off Detector</Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

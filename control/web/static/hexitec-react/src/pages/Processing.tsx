import React from 'react';
import { Container, Row, Col, Card, Form, Button, ProgressBar } from 'react-bootstrap';
import { UserAware } from '../components/UserAware';

interface ProcessingProps {
  endpoint_url: string;
}

function Processing({ endpoint_url }: ProcessingProps) {
  return (
    <Container>
      <Row>
        {/* File Uploads - Power User Only */}
        <Col md={6}>
          <UserAware userLevel="power" endpoint_url={endpoint_url}>
            <Card className="mb-3">
              <Card.Header><strong>File Uploads</strong></Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Gradients Upload</Form.Label>
                    <Form.Control type="file" accept=".csv" />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Intercepts Upload</Form.Label>
                    <Form.Control type="file" accept=".csv" />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Thresholds Upload</Form.Label>
                    <Form.Control type="file" accept=".csv" />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Pixel Mask Upload</Form.Label>
                    <Form.Control type="file" accept=".csv" />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </UserAware>
        </Col>

        {/* Processing Settings */}
        <Col md={6}>
          <Card className="mb-3">
            <Card.Header><strong>Processing Settings</strong></Card.Header>
            <Card.Body>
              <UserAware userLevel="basic" endpoint_url={endpoint_url}>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Charge-sharing Options</Form.Label>
                    <Form.Select>
                      <option value="off" selected>Off</option>
                      <option value="csd">CSD</option>
                      <option value="csa">CSA</option>
                    </Form.Select>
                  </Col>
                </Row>
              </UserAware>

              <UserAware userLevel="power" endpoint_url={endpoint_url}>
                <Row className="mb-3">
                  <Col sm={6}>
                    <Form.Label>Dark Tracking</Form.Label>
                    <Form.Check type="switch" id="dark-tracking" label="On" defaultChecked />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Thresholds Global</Form.Label>
                    <Form.Control type="number" defaultValue="50" />
                    <Form.Text className="text-muted">Value (ADU)</Form.Text>
                  </Col>
                </Row>
              </UserAware>

              <UserAware userLevel="basic" endpoint_url={endpoint_url}>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Timing Resolution</Form.Label>
                    <Form.Control type="number" defaultValue="1" />
                    <Form.Text className="text-muted">Value (s) between accepted min/maxs</Form.Text>
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

export default Processing;
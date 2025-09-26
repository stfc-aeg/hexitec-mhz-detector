import React from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { UserAware } from '../components/UserAware';

interface AsicControlProps {
  endpoint_url: string;
}

function AsicControl({ endpoint_url }: AsicControlProps) {
  return (
    <Container>
      <UserAware userLevel="power" endpoint_url={endpoint_url}>
        <Row>
          <Col md={6}>
            <Card className="mb-3">
              <Card.Header><strong>Register Control</strong></Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col sm={6}>
                    <Form.Label>Register Address</Form.Label>
                    <Form.Control type="text" placeholder="0x000" />
                  </Col>
                  <Col sm={6}>
                    <Form.Label>Value to Set</Form.Label>
                    <Form.Control type="text" placeholder="0x00" />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Button variant="primary" className="w-100">Set Register Value</Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="mb-3">
              <Card.Header><strong>Register Reading</strong></Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Register Address</Form.Label>
                    <Form.Control type="text" placeholder="0x000" />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Button variant="info" className="w-100">Read Register Value</Button>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Current Value</Form.Label>
                    <Form.Control type="text" value="0x00" readOnly />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </UserAware>
    </Container>
  );
}

export default AsicControl;
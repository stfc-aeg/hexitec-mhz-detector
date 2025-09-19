import React from 'react';
import { Container, Row, Col, Card, Table, Form, Button } from 'react-bootstrap';
import { UserAware } from '../components/UserAware';

interface RegisterMapProps {
  endpoint_url: string;
}

function RegisterMap({ endpoint_url }: RegisterMapProps) {
  // Mock register data
  const mockRegisters = [
    { address: '0x000', name: 'Control Register', description: 'Main control register', value: '0x01' },
    { address: '0x001', name: 'Status Register', description: 'System status', value: '0x00' },
    { address: '0x002', name: 'Config Register', description: 'Configuration settings', value: '0xFF' },
  ];

  return (
    <Container>
      <UserAware userLevel="power" endpoint_url={endpoint_url}>
        <Row>
          <Col>
            <Card className="mb-3">
              <Card.Header><strong>Full Register Map</strong></Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Control type="text" placeholder="Search registers..." />
                  </Col>
                  <Col md={2}>
                    <Button variant="outline-secondary">Search</Button>
                  </Col>
                </Row>
                
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Address</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Current Value</th>
                        <th>New Value</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockRegisters.map((register, index) => (
                        <tr key={index}>
                          <td><code>{register.address}</code></td>
                          <td>{register.name}</td>
                          <td>{register.description}</td>
                          <td><code>{register.value}</code></td>
                          <td>
                            <Form.Control 
                              type="text" 
                              size="sm" 
                              placeholder="0x00" 
                            />
                          </td>
                          <td>
                            <Button variant="outline-primary" size="sm">
                              Set
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </UserAware>
    </Container>
  );
}

export default RegisterMap;
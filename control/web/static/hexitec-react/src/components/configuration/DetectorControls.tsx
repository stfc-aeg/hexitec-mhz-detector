import { Row, Col, Card, Form, Button, FloatingLabel } from 'react-bootstrap';
import { UserAware } from '../UserAware';
import { WithEndpoint } from 'odin-react';
import { floatingInputStyle } from '../../utils';

interface DetectorControlsProps {
  proxyEndpoint: any;
}

const EndpointSelect = WithEndpoint(Form.Select);

export default function DetectorControls({ proxyEndpoint }: DetectorControlsProps) {

  const lokiData = proxyEndpoint.data?.loki?.application;

  return (
    <Card className="mt-3">
      <Card.Header><strong>Detector Controls</strong></Card.Header>
      <Card.Body>
        <Row className="mb-3">
          {/* This is an endpoint dropdown for feedback gain in loki
          so the options are 7, 14, and 21 with unit femtofarads fF*/}
          <Col>
            <FloatingLabel label="Feedback Gain Stage">

              <EndpointSelect
                endpoint={proxyEndpoint}
                fullpath="loki/application/asic_settings/feedback_capacitance"
                variant="outline-secondary"
                style={floatingInputStyle}
                >
                  <option value="7">7fF (High)</option>
                  <option value="14">14fF (Medium)</option>
                  <option value="21">21fF (Low)</option>
              </EndpointSelect>
            </FloatingLabel>
          </Col>
        </Row>

        <UserAware userLevel="power" as={Row} className="mb-3">
          <Col>
            <FloatingLabel label="Negative Dynamic Range">
              <EndpointSelect
                endpoint={proxyEndpoint}
                fullpath="loki/application/asic_settings/negative_range"
                variant="outline-secondary"
                style={floatingInputStyle}
              >
                <option value="-20">-20 keV</option>
                <option value="-10">-10 keV</option>
              </EndpointSelect>
            </FloatingLabel>
          </Col>
        </UserAware>

        <Row className="mt-3">
          <Col>
            <Button variant="danger" className="w-100">Reboot Detector (Placeholder)</Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

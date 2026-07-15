import { Row, Col, Card, Form, Button, FloatingLabel } from 'react-bootstrap';
import { UserAware } from '../UserAware';
import { WithEndpoint, type AdapterEndpoint } from 'odin-react';
import { floatingInputStyle } from '../../utils';
import type { ProxyParams } from '../../EndpointTypes';

interface DetectorControlsProps {
  proxyEndpoint: AdapterEndpoint<ProxyParams>;
  isCustom: boolean;
}

const EndpointSelect = WithEndpoint(Form.Select);

export default function DetectorControls({ proxyEndpoint, isCustom }: DetectorControlsProps) {

  const lokiData = proxyEndpoint.data?.loki?.application?.asic_settings;

  // low: something, high: something
  const negativeRangeOptions = lokiData?.negative_range_options ?? {};

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
                disabled={!isCustom}
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
                fullpath="loki/application/asic_settings/negative_range_lowhigh"
                variant="outline-secondary"
                style={floatingInputStyle}
                disabled={!isCustom}
              >
                <option value={"low"}>{negativeRangeOptions.low} (Low)</option>
                <option value={"high"}>{negativeRangeOptions.high} (High)</option>
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

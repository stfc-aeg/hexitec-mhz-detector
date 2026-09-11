import { Row, Col, Card, Form, FloatingLabel } from 'react-bootstrap';
import { UserAware } from '../UserAware';
import { WithEndpoint, type AdapterEndpoint, EndpointButton, EndpointInput } from '@dssg/odin-react';;
import { checkNull, checkNullNoDp, floatingInputStyle, floatingLabelStyle } from '../../utils.js';
import type { ProxyParams } from '../../EndpointTypes';

interface EnvironmentalProps {
  proxyEndpoint: AdapterEndpoint<ProxyParams>;
  isCustom: boolean;
}

const EndpointSelect = WithEndpoint(Form.Select);

export default function Environmental({
  proxyEndpoint, isCustom
}: EnvironmentalProps) {
  const lokiData = proxyEndpoint.data?.loki?.application;
  const envData = proxyEndpoint.data?.loki?.environment;

  const peltierModes = proxyEndpoint?.data?.loki?.application?.peltier?.modes_available ?? [];

  return (
    <>
      <Card className="mt-3">
        <Card.Header><strong>Power & Environmental</strong></Card.Header>
        <Card.Body>
          <Row>
            <Col>
              <h5 className="text-center">HV Bias</h5>
            </Col>
          </Row>
          <Row className="mb-2">
            <Col sm={6}>
              <EndpointButton className="w-100"
                endpoint={proxyEndpoint} fullpath="loki/application/HV/ENABLE"
                variant={lokiData?.HV?.ENABLE ? 'danger' : 'primary'}
                value={!(lokiData?.HV?.ENABLE)}
                disabled={!isCustom}
              >
                {lokiData?.HV?.ENABLE ? 'Disable HV' : 'Enable HV'}
              </EndpointButton>
            </Col>
            <Col sm={6}>
              <FloatingLabel label="HV Reading">
                <Form.Control
                  plaintext
                  readOnly
                  style={floatingLabelStyle}
                  value={checkNull(lokiData?.HV?.readback_bias)}
                />
              </FloatingLabel>
            </Col>
          </Row>
          <UserAware userLevel="power" as={Row} className='mb-3'>
            <Col>
              <FloatingLabel label="HV Target Bias">
                <EndpointInput
                  endpoint={proxyEndpoint}
                  fullpath="loki/application/HV/target_bias"
                  disabled={!isCustom}
                />
              </FloatingLabel>
            </Col>
            <Col>
              <FloatingLabel label="Current Target Bias">
                <Form.Control
                  plaintext
                  readOnly
                  style={floatingLabelStyle}
                  value={checkNull(lokiData?.HV?.target_bias)}
                />
              </FloatingLabel>
            </Col>
          </UserAware>

          <Row>
            <Col>
              <h5 className="mt-3 text-center">Peltier</h5>
            </Col>
          </Row>
          <Row className="mb-3">
              <Col>
                <EndpointButton
                  endpoint={proxyEndpoint} fullpath="loki/application/peltier/enable"
                  variant={lokiData?.peltier?.enable ? 'danger' : 'primary'}
                  value={lokiData?.peltier?.enable ? false : true}
                  disabled={!isCustom}
                >
                  {lokiData?.peltier?.enable ? 'Disable Peltier' : 'Enable Peltier'}
                </EndpointButton>
              </Col>
              <UserAware userLevel="power" as={Col}>
                <FloatingLabel label="Count">
                  <Form.Control
                    plaintext
                    readOnly
                    style={floatingLabelStyle}
                    value={checkNullNoDp(lokiData?.peltier.count)}
                  />
                </FloatingLabel>
              </UserAware>
            </Row>

            <UserAware userLevel="power" as={Row} className='mb-3'>
              <Col>
                <Row>
                  <Col>
                    <FloatingLabel label="Peltier Mode">
                      <EndpointSelect
                        endpoint={proxyEndpoint}
                        fullpath="loki/application/peltier/mode"
                        variant="outline-secondary"
                        style={floatingInputStyle}
                        disabled={!isCustom}
                      >
                        {peltierModes.map((selection) => (
                          <option value={selection} key={selection}>{selection}</option>
                        ))}
                      </EndpointSelect>
                    </FloatingLabel>
                  </Col>
                  <Col>
                    <FloatingLabel label="Setpoint">
                      <EndpointInput
                        endpoint={proxyEndpoint}
                        fullpath="loki/application/peltier/temperature"
                        style={floatingInputStyle}
                        disabled={!isCustom}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>

              </Col>
              <Col>
                <FloatingLabel label="Temperature">
                  <Form.Control
                    plaintext
                    readOnly
                    style={floatingLabelStyle}
                    value={checkNull(lokiData?.peltier.temperature)}
                  />
                </FloatingLabel>
              </Col>
            </UserAware>

          <Row>
            <Col>
              <h5 className="mt-3 text-center">Status</h5>
            </Col>
          </Row>
          <Row className="mb-3">
              <Col sm={6}>
                <Row>
                  <Col>
                    <FloatingLabel label="Humidity">
                      <Form.Control
                        plaintext
                        readOnly
                        style={floatingLabelStyle}
                        value={checkNull(envData?.humidity.BOARD)}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <FloatingLabel label="Dew Point">
                      <Form.Control
                        plaintext
                        readOnly
                        style={floatingLabelStyle}
                        value={checkNull(envData?.temperature?.DEWPOINT)}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
              </Col>
              <Col sm={6}>
                <Row>
                  <Col>
                    <FloatingLabel label="Diode Temp.">
                      <Form.Control
                        plaintext
                        readOnly
                        style={floatingLabelStyle}
                        value={checkNull(envData?.temperature.DIODE)}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <FloatingLabel label="Block Temp.">
                      <Form.Control
                        plaintext
                        readOnly
                        style={floatingLabelStyle}
                        value={checkNull(envData?.temperature.BLOCK)}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
              </Col>
            </Row>
        </Card.Body>
      </Card>
    </>
  );
}

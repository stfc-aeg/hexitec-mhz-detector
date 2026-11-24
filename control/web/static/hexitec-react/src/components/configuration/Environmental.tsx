import { Row, Col, Card, Form, FloatingLabel } from 'react-bootstrap';
import { UserAware } from '../UserAware';
import { EndpointSelect, type AdapterEndpoint, EndpointButton, EndpointInput, EndpointSlider } from '@dssg/odin-react';;
import { checkNull, floatingLabelStyle } from '../../utils.js';
import type { ProxyParams } from '../../EndpointTypes';

interface EnvironmentalProps {
  proxyEndpoint: AdapterEndpoint<ProxyParams>;
  isCustom: boolean;
}

export default function Environmental({
  proxyEndpoint, isCustom
}: EnvironmentalProps) {
  const lokiData = proxyEndpoint.data?.loki?.application;
  const envData = proxyEndpoint.data?.loki?.environment;

  const peltierModes = proxyEndpoint?.data?.loki?.application?.peltier?.modes_available ?? [];
  const peltierMode = lokiData?.peltier?.mode;
  const peltierProportion = lokiData?.peltier?.proportion;
  const peltierTargetSensors = lokiData?.peltier?.pid_target_sensors_available ?? [];
  const peltierTargetSensor = lokiData?.peltier?.pid_target_sensor;
  const peltierTargetSensorReading = peltierTargetSensor
    ? envData?.temperature[peltierTargetSensor]
    : undefined;
  const peltierPidState = lokiData?.peltier?.pid_state;
  const peltierPidStatus = peltierPidState == null
    ? 'null'
    : peltierPidState || 'Within output range';
  const manualOutputPercent = peltierProportion === undefined
    ? 1
    : Math.min(100, Math.max(1, peltierProportion * 100));
  const peltierDriveOutput = peltierProportion === undefined || peltierProportion < 0 || peltierProportion > 1
    ? 'null'
    : `${(peltierProportion * 100).toFixed(1)}%`;
  const percentToProportion = ({ value }: { value: unknown }) => {
    const percent = Number(value);
    return Math.min(100, Math.max(1, Number.isFinite(percent) ? percent : 1)) / 100;
  };

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
            </Row>

            <UserAware userLevel="power">
              <Row className="mb-3">
                <Col>
                  <FloatingLabel label="Peltier Mode">
                    <EndpointSelect
                      endpoint={proxyEndpoint}
                      fullpath="loki/application/peltier/mode"
                      disabled={!isCustom}
                    >
                      {peltierModes.map((selection) => (
                        <option value={selection} key={selection}>{selection}</option>
                      ))}
                    </EndpointSelect>
                  </FloatingLabel>
                </Col>
                <Col>
                  {peltierMode === 'manual' ? (
                    <>
                      <FloatingLabel label="Manual output setpoint (%)">
                        <EndpointInput
                          endpoint={proxyEndpoint}
                          fullpath="loki/application/peltier/proportion"
                          type="number"
                          min={1}
                          max={100}
                          step={1}
                          value={manualOutputPercent}
                          pre_method={percentToProportion}
                          pre_args={{ value: null }}
                          disabled={!isCustom}
                        />
                      </FloatingLabel>
                      <EndpointSlider
                        endpoint={proxyEndpoint}
                        fullpath="loki/application/peltier/proportion"
                        min={1}
                        max={100}
                        step={1}
                        value={manualOutputPercent}
                        pre_method={percentToProportion}
                        pre_args={{ value: null }}
                        showTooltip
                        aria-label="Manual output setpoint (%)"
                        disabled={!isCustom}
                      />
                    </>
                  ) : peltierMode === 'pid' ? (
                    <FloatingLabel label="PID target temperature (C)">
                      <EndpointInput
                        endpoint={proxyEndpoint}
                        fullpath="loki/application/peltier/temperature"
                        disabled={!isCustom}
                      />
                    </FloatingLabel>
                  ) : null}
                </Col>
              </Row>
              {peltierMode === 'manual' && (
                <Row className="mb-3">
                  <Col>
                    <FloatingLabel label="Predicted temperature (C)">
                      <Form.Control
                        plaintext
                        readOnly
                        style={floatingLabelStyle}
                        value={checkNull(lokiData?.peltier?.temperature)}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
              )}
              {peltierMode === 'pid' && (
                <>
                  <Row className="mb-2">
                    <Col>
                      <FloatingLabel label="PID control sensor">
                        <EndpointSelect
                          endpoint={proxyEndpoint}
                          fullpath="loki/application/peltier/pid_target_sensor"
                          disabled={!isCustom}
                        >
                          {peltierTargetSensors.map((sensor) => (
                            <option value={sensor} key={sensor}>{sensor}</option>
                          ))}
                        </EndpointSelect>
                      </FloatingLabel>
                    </Col>
                    <Col>
                      <FloatingLabel label={`${peltierTargetSensor ?? 'Control sensor'} reading (C)`}>
                        <Form.Control
                          plaintext
                          readOnly
                          style={floatingLabelStyle}
                          value={checkNull(peltierTargetSensorReading)}
                        />
                      </FloatingLabel>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col>
                      <FloatingLabel label="Controller output (%)">
                        <Form.Control
                          plaintext
                          readOnly
                          style={floatingLabelStyle}
                          value={peltierDriveOutput}
                        />
                      </FloatingLabel>
                    </Col>
                    <Col>
                      <FloatingLabel label="PID status">
                        <Form.Control
                          plaintext
                          readOnly
                          style={floatingLabelStyle}
                          value={peltierPidStatus}
                        />
                      </FloatingLabel>
                    </Col>
                  </Row>
                </>
              )}
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
                    <FloatingLabel label="Diode temperature (C)">
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
                    <FloatingLabel label="Block temperature (C)">
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

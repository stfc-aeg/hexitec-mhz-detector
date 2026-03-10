import { Container, Row, Col, Card, Form, Button, Badge, FloatingLabel} from 'react-bootstrap';
import { UserAware } from '../components/UserAware';
import { WithEndpoint, useAdapterEndpoint, type ParamTree } from 'odin-react';
import { checkNull, checkNullNoDp, floatingInputStyle, floatingLabelStyle } from '../utils.js';

interface LokiEnviromentParams extends ParamTree {
  // This is not all the values but just the ones used here.
  temperature: {
    DIODE: number;
    BLOCK: number;
  }
  humidity: {
    BOARD: number;
  }
}

interface LokiApplicationData extends ParamTree {
  HV: {
    ENABLE: number;
    readback_bias: number;
    target_bias: number;
  };
  peltier: {
    proportion: number;
    proportion_save: boolean;
    count: number;
    temperature: number;
    enable: boolean;
  }
}

interface LokiCarrierParams extends ParamTree{
  environment: LokiEnviromentParams;
  application: LokiApplicationData;
}

interface ProxyParams extends ParamTree{
  loki: LokiCarrierParams
  status: {
    loki: {
      url: string;
      status_code: number;
      error: string;
      last_update: string;
    }
  }
}

interface CameraControlProps {
  endpoint_url: string;
}

const EndpointFormControl = WithEndpoint(Form.Control);
const EndpointButton = WithEndpoint(Button);
const EndpointSelect= WithEndpoint(Form.Select);

function CameraControl({ endpoint_url }: CameraControlProps) {

  const proxyEndpoint = useAdapterEndpoint<ProxyParams>('proxy', endpoint_url, 1000);
  const lokiData = proxyEndpoint.data?.loki?.application;
  const envData = proxyEndpoint.data?.loki?.environment;

  const peltierSetpoints = [20, 40, 45, 50, 55, 60, 65, 70, 75, 80];

  return (
    <Container>
      <Row>
        {/* Power and Environmental Controls */}
        <Col md={6}>
          <Card className="mt-3">
            <Card.Header><strong>Power & Environmental</strong></Card.Header>
            <Card.Body>

            <Row>
              <Row>
                <Col>
                  <h5 className="text-center">HV Bias</h5>
                </Col>
              </Row>
              <Row className="mb-2">
                <Col sm={6}>
                  <EndpointButton className="w-100"
                    endpoint={proxyEndpoint} fullpath="loki/application/HV/ENABLE"
                    variant={lokiData?.HV?.ENABLE ? "danger" : "primary"}
                    value={lokiData?.HV?.ENABLE ? 0 : 1}
                  >
                    {lokiData?.HV?.ENABLE ? "Disable HV" : "Enable HV"}
                  </EndpointButton>
                </Col>
                <Col sm={6}>
                  <FloatingLabel
                    label="HV Reading">
                      <Form.Control
                        plaintext
                        readOnly
                        style={floatingLabelStyle}
                        value={checkNull(lokiData?.HV.readback_bias)}
                      />
                  </FloatingLabel>
                </Col>
              </Row>
              <UserAware userLevel="power" as={Row} className='mb-3'>
                <Col>
                  <FloatingLabel 
                    label="HV Target Bias">
                      <EndpointFormControl
                        endpoint={proxyEndpoint} fullpath={"loki/application/HV/target_bias"}
                        type="number"
                        style={floatingInputStyle}
                      />
                  </FloatingLabel>
                </Col>
                <Col>
                  <FloatingLabel
                    label="Current Target Bias">
                      <Form.Control
                        plaintext
                        readOnly
                        style={floatingLabelStyle}
                        value={checkNull(lokiData?.HV.target_bias)}
                      />
                  </FloatingLabel>
                </Col>
              </UserAware>
            </Row>
            <Row>
              <Row>
                <Col>
                  <h5 className="mt-3 text-center">Peltier</h5>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col>
                  <EndpointButton
                    endpoint={proxyEndpoint} fullpath="loki/application/peltier/enable"
                    variant={lokiData?.peltier?.enable ? "danger" : "primary"}
                    value={lokiData?.peltier?.enable ? 0 : 1}
                  >
                    {lokiData?.peltier?.enable ? "Disable Peltier" : "Enable Peltier"}
                  </EndpointButton>
                </Col>
                <UserAware userLevel="power" as={Col}>
                  <FloatingLabel
                    label="Count">
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
                  <FloatingLabel
                    label="Proportion/Setpoint">
                    <EndpointSelect
                      endpoint={proxyEndpoint}
                      fullpath="loki/application/peltier/proportion"
                      variant="outline-secondary"
                      buttonText={checkNullNoDp(lokiData?.peltier.proportion*100)}
                      style={floatingInputStyle}>
                        {(peltierSetpoints).map(
                          (selection, index) => (
                            <option value={selection} key={index}>{selection}</option>
                          )
                        )}
                    </EndpointSelect>
                  </FloatingLabel>
                </Col>
                <Col>
                  <FloatingLabel
                    label="Temperature">
                      <Form.Control
                        plaintext
                        readOnly
                        style={floatingLabelStyle}
                        value={checkNull(lokiData?.peltier.temperature)}
                      />
                  </FloatingLabel>
                </Col>
              </UserAware>
            </Row>
            <Row>
              <Row>
                <Col>
                  <h5 className="mt-3 text-center">Status</h5>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4}>
                  <FloatingLabel
                    label="Humidity">
                      <Form.Control
                        plaintext
                        readOnly
                        style={floatingLabelStyle}
                        value={checkNull(envData?.humidity.BOARD)}
                      />
                  </FloatingLabel>
                </Col>
                <Col sm={4}>
                  <FloatingLabel
                    label="Diode Temp.">
                      <Form.Control
                        plaintext
                        readOnly
                        style={floatingLabelStyle}
                        value={checkNull(envData?.temperature.DIODE)}
                      />
                  </FloatingLabel>
                </Col>
                <Col sm={4}>
                  <FloatingLabel
                    label="Block Temp.">
                      <Form.Control
                        plaintext
                        readOnly
                        style={floatingLabelStyle}
                        value={checkNull(envData?.temperature.BLOCK)}
                      />
                  </FloatingLabel>
                </Col>
              </Row>
            </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Detector Controls */}
        <Col md={6}>
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

              <UserAware userLevel="power" as={Row} className='mb-3'>
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
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default CameraControl;
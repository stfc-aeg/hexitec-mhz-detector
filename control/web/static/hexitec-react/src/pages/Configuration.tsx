import { Container, Row, Col, Card, Form, Button, InputGroup, FloatingLabel} from 'react-bootstrap';
import { UserAware } from '../components/UserAware';
import { WithEndpoint, useAdapterEndpoint, type ParamTree } from 'odin-react';
import { checkNull, checkNullNoDp, floatingInputStyle, floatingLabelStyle } from '../utils.js';
import type { ProxyParams, HistogramTypes, MetadataType } from '../EndpointTypes';
import { FilePicker } from '../components/FilePicker';

interface ConfigurationProps {
  endpoint_url: string;
}

const EndpointFormControl = WithEndpoint(Form.Control);
const EndpointButton = WithEndpoint(Button);
const EndpointSelect= WithEndpoint(Form.Select);
const EndpointCheck = WithEndpoint(Form.Check);


function Configuration({ endpoint_url }: ConfigurationProps) {

  const proxyEndpoint = useAdapterEndpoint<ProxyParams>('proxy', endpoint_url, 1000);
  const lokiData = proxyEndpoint.data?.loki?.application;
  const envData = proxyEndpoint.data?.loki?.environment;

  const peltierSetpoints = [20, 40, 45, 50, 55, 60, 65, 70, 75, 80];

  const histogramEndpoint = useAdapterEndpoint<HistogramTypes>('histogram', endpoint_url, 500);
  const histogramMetadata = histogramEndpoint.metadata;
  // File uploads: the allowed values here usually match but are separated for consistency
  const badpixmask_metadata = histogramMetadata?.config?.hist_format?.bad_pixel_mask?.filename as MetadataType|undefined;  
  const badpixthres_metadata = histogramMetadata?.config?.thresholds?.bad_pixel?.filename as MetadataType|undefined;
  const l3file_metadata = histogramMetadata?.config?.charge_sharing?.l3_filename as MetadataType|undefined;
  const posfile_metadata = histogramMetadata?.config?.charge_sharing?.mc_filename as MetadataType|undefined;
  const mcfile_metadata = histogramMetadata?.config?.charge_sharing?.pos_filename as MetadataType|undefined;
  // Baseline tracking
  const baselinedivide_metadata = histogramMetadata?.config?.baseline?.divide as MetadataType|undefined;
  const baselinemask_metadata = histogramMetadata?.config?.baseline?.mask as MetadataType|undefined;
  

  return (
      <Container>
        <Row>
          <Col md={6}>
            <Row>
            <Col>
              {/* Power and Environmental Controls */}
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
            </Row>
            <Row>
            <Col>  
              {/* File Uploads - Power User Only */}
              <UserAware userLevel="power" as={Card} className="mt-3">
                <Card.Header><strong>File Uploads</strong></Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col>
                      <Form.Label>Gradients Upload</Form.Label>
                      <Form.Control type="file" accept=".csv" disabled/>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col>
                      <Form.Label>Intercepts Upload</Form.Label>
                      <Form.Control type="file" accept=".csv" disabled/>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col>
                      <Form.Label>Bad Pixel Thresholds File load</Form.Label>
                      <FilePicker
                        endpoint={histogramEndpoint}
                        fullpath={"config/thresholds/bad_pixel/filename"}
                        buttonText={histogramEndpoint.data?.config?.thresholds?.bad_pixel?.filename}
                        param_metadata={badpixthres_metadata}
                        loadButton={true}
                        loadPath={"config/thresholds/bad_pixel/load"}
                      />
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col>
                      <Form.Label>Bad Pixel Mask File load</Form.Label>
                      <FilePicker
                        endpoint={histogramEndpoint}
                        fullpath={"config/hist_format/bad_pixel_mask/filename"}
                        buttonText={histogramEndpoint.data?.config?.hist_format?.bad_pixel_mask?.filename}
                        param_metadata={badpixmask_metadata}
                        loadButton={true}
                        loadPath={"config/hist_format/bad_pixel_mask/load"}
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </UserAware>
            </Col>
            </Row>
          </Col>
          <Col md={6}>
            <Card className="mt-3">
              <Card.Header><strong>Processing Settings</strong></Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col>
                    <Form.Label><b>Charge-sharing Options</b></Form.Label>
                    <Row>
                      <Col>
                        <EndpointCheck
                          endpoint={histogramEndpoint}
                          fullpath="config/charge_sharing/positive_edge"
                          type="switch"
                          label="Positive Edge"
                        />
                      </Col>
                      <Col>
                        <EndpointCheck
                          endpoint={histogramEndpoint}
                          fullpath="config/charge_sharing/sum_enable"
                          type="switch"
                          label="Sum Enable"
                        />
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col>
                        <EndpointCheck
                          endpoint={histogramEndpoint}
                          fullpath="config/charge_sharing/negative_neighbour"
                          type="switch"
                          label="Negative Neighbour"
                        />
                      </Col>
                      <Col>
                        <EndpointCheck
                          endpoint={histogramEndpoint}
                          fullpath="config/charge_sharing/position_adjust"
                          type="switch"
                          label="Position Adjust"
                        />
                      </Col>
                    </Row>
                    <Row className="mb-2">
                      <Form.Label>L3 File load</Form.Label>
                      <FilePicker
                        endpoint={histogramEndpoint}
                        fullpath={"config/charge_sharing/l3_filename"}
                        buttonText={histogramEndpoint.data?.config?.charge_sharing?.l3_filename}
                        param_metadata={l3file_metadata}
                        loadButton={true}
                        loadPath={"config/charge_sharing/l3_load"}
                      />
                    </Row>
                    <Row className="mb-2">
                      <Form.Label>MC File load</Form.Label>
                      <FilePicker
                        endpoint={histogramEndpoint}
                        fullpath={"config/charge_sharing/mc_filename"}
                        buttonText={histogramEndpoint.data?.config?.charge_sharing?.mc_filename}
                        param_metadata={mcfile_metadata}
                        loadButton={true}
                        loadPath={"config/charge_sharing/mc_load"}
                      />
                    </Row>
                    <Row className="mb-2">
                      <Form.Label>Pos File load</Form.Label>
                      <FilePicker
                        endpoint={histogramEndpoint}
                        fullpath={"config/charge_sharing/pos_filename"}
                        buttonText={histogramEndpoint.data?.config?.charge_sharing?.pos_filename}
                        param_metadata={posfile_metadata}
                        loadButton={true}
                        loadPath={"config/charge_sharing/pos_load"}
                      />
                    </Row>
                  </Col>
                </Row>
  
                <UserAware userLevel="power">
                  <Row className="mb-3">
                    <Col>
                      <Form.Label><b>Dark Tracking / Baseline Load</b></Form.Label>
                      <Row className="mb-3">
                        <Col>
                          <EndpointCheck
                            endpoint={histogramEndpoint}
                            fullpath={"config/baseline/dither"}
                            label="Dither"
                            type="switch"
                          />
                        </Col>
                      </Row>
                      <Row className="mb-3">
                        <Col>
                          <InputGroup>
                            <InputGroup.Text className="justify-content-center" style={{width:'33%'}}>Baseline Divide</InputGroup.Text>
                            <EndpointSelect
                              endpoint={histogramEndpoint}
                              fullpath={"config/baseline/divide"}
                              value={histogramEndpoint.data?.config?.baseline?.divide}
                            >
                              {(baselinedivide_metadata?.allowed_values ?? []).map(
                                (selection, index) => (
                                  <option value={selection} key={selection}>
                                    {selection}
                                  </option>
                                )
                              )}
                            </EndpointSelect>
                          </InputGroup>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col>
                      <Form.Label><b>Thresholds Global</b></Form.Label>
                      {/* These are min/max pairs */}
                      <InputGroup>
                        <InputGroup.Text className="fw-semibold justify-content-center" style={{width:'20%'}}>Low</InputGroup.Text>
                        <FloatingLabel label="Negative">
                          <EndpointFormControl 
                            endpoint={histogramEndpoint}
                            fullpath="config/thresholds/low/neg"
                            style={floatingInputStyle}
                          />
                        </FloatingLabel>
                        <FloatingLabel label="Positive">
                          <EndpointFormControl 
                            endpoint={histogramEndpoint}
                            fullpath="config/thresholds/low/pos"
                            style={floatingInputStyle}
                          />
                        </FloatingLabel>
                      </InputGroup>
                      <InputGroup>
                        <InputGroup.Text className="fw-semibold justify-content-center" style={{width:'20%'}}>Main</InputGroup.Text>
                        <FloatingLabel label="Negative">
                          <EndpointFormControl 
                            endpoint={histogramEndpoint}
                            fullpath="config/thresholds/main/neg"
                            style={floatingInputStyle}
                          />
                        </FloatingLabel>
                        <FloatingLabel label="Positive">
                          <EndpointFormControl 
                            endpoint={histogramEndpoint}
                            fullpath="config/thresholds/main/pos"
                            style={floatingInputStyle}
                          />
                        </FloatingLabel>
                      </InputGroup>
                      <InputGroup>
                        <InputGroup.Text className="fw-semibold justify-content-center" style={{width:'20%'}}>Absolute</InputGroup.Text>
                        <FloatingLabel label="Low">
                          <EndpointFormControl 
                            endpoint={histogramEndpoint}
                            fullpath="config/thresholds/absolute/low"
                            style={floatingInputStyle}
                          />
                        </FloatingLabel>
                        <FloatingLabel label="High">
                          <EndpointFormControl 
                            endpoint={histogramEndpoint}
                            fullpath="config/thresholds/absolute/high"
                            style={floatingInputStyle}
                          />
                        </FloatingLabel>
                      </InputGroup>
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

export default Configuration;
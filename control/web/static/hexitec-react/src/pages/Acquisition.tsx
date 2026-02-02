import { Container, Row, Col, Card, Form, Button, ProgressBar, FloatingLabel } from 'react-bootstrap';
import { UserAware } from '../components/UserAware';
import { WithEndpoint, useAdapterEndpoint } from 'odin-react';
import { floatingInputStyle, checkNullNoDp } from '../utils.js'
import type { MunirTypes } from '../EndpointTypes';

const EndpointFormControl = WithEndpoint(Form.Control);

interface AcquisitionProps {
  endpoint_url: string;
}

function Acquisition({ endpoint_url }: AcquisitionProps) {

  const munirEndpoint = useAdapterEndpoint<MunirTypes>('munir', endpoint_url, 500);
  // console.log(munirEndpoint?.data?.subsystems?.hexitec_mhz?.args)

  return (
    <Container>
      <Row>
        {/* Acquisition Settings */}
        <Col md={6}>
          <Card className="mt-3">
            <Card.Header><strong>Acquisition Settings</strong></Card.Header>
            <Card.Body>
              <UserAware userLevel="basic" endpoint_url={endpoint_url}>
                {/* Acquisition Length (frames) */}
                <Row className="mb-3">
                  <Col>
                    <FloatingLabel 
                      label="Acquisition length (seconds)">
                        <EndpointFormControl
                          endpoint={munirEndpoint} fullpath="subsystems/hexitec_mhz/args/num_frames"  // frames length
                          type="number"
                          style={floatingInputStyle}
                        />
                    </FloatingLabel>
                    <Form.Text>Est. {checkNullNoDp(munirEndpoint?.data.subsystems?.hexitec_mhz.args.num_frames*1000000).toLocaleString()} frames</Form.Text>
                  </Col>
                </Row>

                {/* File Name */}
                <Row className="mb-3">
                  <Col>
                    <FloatingLabel 
                      label="File Name (without .h5 extension)">
                        <EndpointFormControl
                          endpoint={munirEndpoint} fullpath="subsystems/hexitec_mhz/args/file_name"
                          type="text"
                          style={floatingInputStyle}
                        />
                    </FloatingLabel>

                  </Col>
                </Row>

                {/* (File Path) */}
                <Row className="mb-3">
                  <Col>
                    <FloatingLabel 
                      label="File Path">
                        <EndpointFormControl
                          endpoint={munirEndpoint} fullpath="subsystems/hexitec_mhz/args/file_path"
                          type="text"
                          style={floatingInputStyle}
                        />
                    </FloatingLabel>
                  </Col>
                </Row>
              </UserAware>
            </Card.Body>
          </Card>
        </Col>

        {/* Acquisition Status */}
        <Col md={6}>
          <Card className="mt-3">
            <Card.Header><strong>Acquisition Status</strong></Card.Header>
            <Card.Body>
              <UserAware userLevel="basic" endpoint_url={endpoint_url}>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Acquisition Progress</Form.Label>
                    <ProgressBar now={0} label="0%" />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Estimated File Size</Form.Label>
                    <Form.Control type="text" value="0 MB" readOnly />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={6}>
                    <Button variant="success" className="w-100">
                      Start Acquisition
                    </Button>
                  </Col>
                  <Col sm={6}>
                    <Button variant="danger" className="w-100">
                      Stop Acquisition
                    </Button>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Button variant="warning" className="w-100">
                      Freeze Histogram
                    </Button>
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

export default Acquisition;
import { Container, Row, Col, Form, Button, FloatingLabel } from 'react-bootstrap';
import { useAdapterEndpoint, WithEndpoint, TitleCard } from 'odin-react';
import { checkNullNoDp, floatingInputStyle, floatingLabelStyle } from '../utils.js';
import type { HistogramTypes, MetadataType } from '../EndpointTypes';

interface HistogramProps {
  endpoint_url: string;
}

const EndpointButton = WithEndpoint(Button);
const EndpointFormControl = WithEndpoint(Form.Control);
const EndpointSelect = WithEndpoint(Form.Select);

function HistogramControl({ endpoint_url }: HistogramProps) {
  const histogramEndpoint = useAdapterEndpoint<HistogramTypes>('histogram', endpoint_url, 500);

  const histogramMetadata = histogramEndpoint.metadata as HistogramTypes|undefined;
  const mode_metadata = histogramMetadata?.acquisition?.mode as MetadataType|undefined;

  return (
    <Container>
      <TitleCard title="Histogrammer Control">
        <Row>
          <Col xs={12} lg={6} className="mb-3">
            <Row>
              <Col>
                <FloatingLabel label="Status">
                  <Form.Control
                    plaintext
                    readOnly
                    style={floatingLabelStyle}
                    value={histogramEndpoint.data?.device?.status}
                    className='justify-content-center'
                  />
                </FloatingLabel>
              </Col>
              <Col className='d-flex justify-content-center'>
                <EndpointButton
                  endpoint={histogramEndpoint}
                  fullpath="device/connect"
                  value={true}
                  variant="warning"
                >
                  Connect Device
                </EndpointButton>
              </Col>
              <Col className='d-flex justify-content-center'>
                <EndpointButton
                  endpoint={histogramEndpoint}
                  fullpath="udp/setup"
                  value={true}
                  variant="warning"
                >
                  Setup UDP
                </EndpointButton>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col>
                <FloatingLabel label="Duration (s)">
                  <EndpointFormControl
                    endpoint={histogramEndpoint}
                    fullpath="acquisition/duration"
                    type="number"
                    style={floatingInputStyle}
                  />
                </FloatingLabel>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col>
                <FloatingLabel label="Input Frames">
                  <EndpointFormControl
                    endpoint={histogramEndpoint}
                    fullpath="acquisition/input_frames"
                    type="number"
                    style={floatingInputStyle}
                  />
                </FloatingLabel>
              </Col>
              <Col>
                <FloatingLabel label="Output Frames">
                  <EndpointFormControl
                    endpoint={histogramEndpoint}
                    fullpath="acquisition/output_frames"
                    type="number"
                    style={floatingInputStyle}
                  />
                </FloatingLabel>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col>
                <EndpointButton
                  endpoint={histogramEndpoint} fullpath="acquisition/run"
                  value={histogramEndpoint.data?.acquisition?.run ? false : true}
                  variant={histogramEndpoint.data?.acquisition?.run ? 'danger' : 'primary'}
                >
                  {histogramEndpoint.data?.acquisition?.run ? 'Stop Histogrammer' : 'Start Histogrammer'}
                </EndpointButton>
              </Col>
              <Col>
                <FloatingLabel label="Mode">
                  <EndpointSelect
                    endpoint={histogramEndpoint}
                    fullpath="acquisition/mode"
                    variant='outline-secondary'
                    buttonText={histogramEndpoint.data?.acquisition?.mode}
                    style={floatingInputStyle}
                  >
                    {(mode_metadata?.allowed_values ?? []).map(
                      (selection, index) => (
                        <option value={selection} key={index}>
                          {selection}
                        </option>
                      )
                    )}
                  </EndpointSelect>
                </FloatingLabel>
              </Col>
            </Row>

          </Col>
          <Col xs={12} lg={6} xl={3}>
            <FloatingLabel label="Complete Time Frames" className="mb-3">
              <Form.Control
                plaintext
                readOnly
                style={floatingLabelStyle}
                value={checkNullNoDp(histogramEndpoint.data?.acquisition?.count?.complete_time_frames)}
              />
            </FloatingLabel>
            <FloatingLabel label="Raw hits" className="mb-3">
              <Form.Control
                plaintext
                readOnly
                style={floatingLabelStyle}
                value={checkNullNoDp(histogramEndpoint.data?.acquisition?.count?.raw_hits)}
              />
            </FloatingLabel>
            <FloatingLabel label="Detector Frames" className="mb-3">
              <Form.Control
                plaintext
                readOnly
                style={floatingLabelStyle}
                value={checkNullNoDp(histogramEndpoint.data?.acquisition?.count?.detector_frames)}
              />
            </FloatingLabel>
            <FloatingLabel label="UDP Frames" className="mb-3">
              <Form.Control
                plaintext
                readOnly
                style={floatingLabelStyle}
                value={checkNullNoDp(histogramEndpoint.data?.acquisition?.count?.udp_frames)}
              />
            </FloatingLabel>
          </Col>
          <Col xs={12} lg={6} xl={3}></Col>
        </Row>
      </TitleCard>
    </Container>
  )
}

export default HistogramControl;
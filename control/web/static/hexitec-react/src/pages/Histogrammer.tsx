import { Container, Row, Col, Card, Form, Button, FloatingLabel } from 'react-bootstrap';
import { UserAware } from '../components/UserAware';
import { useAdapterEndpoint, WithEndpoint, TitleCard } from 'odin-react';
import { checkNullNoDp, floatingInputStyle, floatingLabelStyle, type MetadataType } from '../utils.js';
import type { ParamTree } from 'odin-react';

interface HistogramProps {
  endpoint_url: string;
}

interface HistogramTypes extends ParamTree {
  acquisition: {
    count: {
      complete_time_frames: number;
      detector_frames: number;
      raw_hits: number;
      udp_frames: number;
    };
    input_frames: number;
    itfg: {
      input_frames: number;
      output_frames: number;
      status: string;
    };
    mode: string;
    output_frames: number;
    run: boolean;
    timer: number;
  };
  config: {
    baseline: {
      dither: boolean;
      divide: number;
      mask: string;
    };
    clustering: {
      auto_trig_mode: string;
      mode: string;
      types: {
        diag1: boolean;
        diag1nl: boolean;
        diag1nr: boolean;
        diag2: boolean;
        diag2nl: boolean;
        diag2nr: boolean;
        hoz: boolean;
        "hoz nl": boolean;
        "hoz nr": boolean;
        l1: boolean;
        l2: boolean;
        l3: boolean;
        l4: boolean;
        lone: boolean;
        quad: boolean;
        vert: boolean;
        "vert na": boolean;
        "vert nb": boolean;
      };
    };
    hist_format: {
      mapped_mode: string;
      num_bins: number;
      run_mode: string;
    };
    thresholds: {
      absolute: number[];
      low: number[];
      main: number[];
    };
  };
  device: {
    connect: boolean;
    device_num: number;
    status: string;
  };
  udp: {
    accelerator: {
      port: number;
      rx_ip: string;
      tx_ip: string;
    };
    destination: {
      ip: string;
      port: number;
    };
    setup: any;
    source: {
      ip: string;
      port: number;
    };
    udp_threads: number;
  };
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
      <TitleCard title="Histogram Control">
        <Row>
          <Col>
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
                    fullpath="acquisition/timer"
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
                  value={true}
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
          <Col>
            <FloatingLabel label="Complete Time Frames">
              <Form.Control
                plaintext
                readOnly
                style={floatingLabelStyle}
                value={checkNullNoDp(histogramEndpoint.data?.acquisition?.count?.complete_time_frames)}
              />
            </FloatingLabel>
            <FloatingLabel label="Raw hits">
              <Form.Control
                plaintext
                readOnly
                style={floatingLabelStyle}
                value={checkNullNoDp(histogramEndpoint.data?.acquisition?.count?.raw_hits)}
              />
            </FloatingLabel>
            <FloatingLabel label="Detector Frames">
              <Form.Control
                plaintext
                readOnly
                style={floatingLabelStyle}
                value={checkNullNoDp(histogramEndpoint.data?.acquisition?.count?.detector_frames)}
              />
            </FloatingLabel>
            <FloatingLabel label="UDP Frames">
              <Form.Control
                plaintext
                readOnly
                style={floatingLabelStyle}
                value={checkNullNoDp(histogramEndpoint.data?.acquisition?.count?.udp_frames)}
              />
            </FloatingLabel>
          </Col>
          <Col xs={2}></Col>
        </Row>
      </TitleCard>
    </Container>
  )
}

export default HistogramControl;
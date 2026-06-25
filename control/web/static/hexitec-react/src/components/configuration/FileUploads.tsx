import { Row, Col, Card, Form, Accordion } from 'react-bootstrap';
import { FilePicker } from '../FilePicker';
import type { HistogramTypes } from '../../EndpointTypes';
import type { AdapterEndpoint } from 'odin-react';

interface FileUploadsProps {
  histogramEndpoint: AdapterEndpoint<HistogramTypes>;
}

export default function FileUploads( { histogramEndpoint }: FileUploadsProps) {

  const histogramMetadata = histogramEndpoint.metadata;
  const badpixmask_metadata = histogramMetadata?.config?.hist_format?.bad_pixel_mask?.filename;
  const badpixthres_metadata = histogramMetadata?.config?.thresholds?.bad_pixel?.filename;
  const l3file_metadata = histogramMetadata?.config?.charge_sharing?.l3_filename;
  const posfile_metadata = histogramMetadata?.config?.charge_sharing?.mc_filename;
  const mcfile_metadata = histogramMetadata?.config?.charge_sharing?.pos_filename;

  return (
    <Card className="mt-3">
      <Card.Header><strong>File Uploads</strong></Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Col>
            <Form.Label>Gradients Upload</Form.Label>
            <Form.Control type="file" accept=".csv" disabled />
          </Col>
        </Row>
        <Row className="mb-3">
          <Col>
            <Form.Label>Intercepts Upload</Form.Label>
            <Form.Control type="file" accept=".csv" disabled />
          </Col>
        </Row>
        <Row className="mb-3">
          <Col>
            <Form.Label>Bad Pixel Thresholds File load</Form.Label>
            <FilePicker
              endpoint={histogramEndpoint}
              fullpath="config/thresholds/bad_pixel/filename"
              buttonText={histogramEndpoint.data?.config?.thresholds?.bad_pixel?.filename ?? ""}
              param_metadata={badpixthres_metadata}
              loadButton
              loadPath="config/thresholds/bad_pixel/load"
            />
          </Col>
        </Row>
        <Row className="mb-3">
          <Col>
            <Form.Label>Bad Pixel Mask File load</Form.Label>
            <FilePicker
              endpoint={histogramEndpoint}
              fullpath="config/hist_format/bad_pixel_mask/filename"
              buttonText={histogramEndpoint.data?.config?.hist_format?.bad_pixel_mask?.filename ?? ""}
              param_metadata={badpixmask_metadata}
              loadButton
              loadPath="config/hist_format/bad_pixel_mask/load"
            />
          </Col>
        </Row>
        <Accordion defaultActiveKey="1" className="mb-3" >
          <Accordion.Item eventKey="0">
            <Accordion.Header>Charge Share File Uploads</Accordion.Header>
            <Accordion.Body>
              <Row className="mb-2">
                <Form.Label>L3 File load</Form.Label>
                <FilePicker
                  endpoint={histogramEndpoint}
                  fullpath="config/charge_sharing/l3_filename"
                  buttonText={histogramEndpoint.data?.config?.charge_sharing?.l3_filename ?? ""}
                  param_metadata={l3file_metadata}
                  loadButton
                  loadPath="config/charge_sharing/l3_load"
                />
              </Row>
              <Row className="mb-2">
                <Form.Label>MC File load</Form.Label>
                <FilePicker
                  endpoint={histogramEndpoint}
                  fullpath="config/charge_sharing/mc_filename"
                  buttonText={histogramEndpoint.data?.config?.charge_sharing?.mc_filename ?? ""}
                  param_metadata={mcfile_metadata}
                  loadButton
                  loadPath="config/charge_sharing/mc_load"
                />
              </Row>
              <Row className="mb-2">
                <Form.Label>Pos File load</Form.Label>
                <FilePicker
                  endpoint={histogramEndpoint}
                  fullpath="config/charge_sharing/pos_filename"
                  buttonText={histogramEndpoint.data?.config?.charge_sharing?.pos_filename ?? ""}
                  param_metadata={posfile_metadata}
                  loadButton
                  loadPath="config/charge_sharing/pos_load"
                />
              </Row>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Card.Body>
    </Card>
  );
}

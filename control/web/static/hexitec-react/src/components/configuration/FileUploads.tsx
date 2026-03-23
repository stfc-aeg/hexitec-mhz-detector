import { Row, Col, Card, Form } from 'react-bootstrap';
import { FilePicker } from '../FilePicker';
import type { MetadataType } from '../../EndpointTypes';

interface FileUploadsProps {
  histogramEndpoint: any;
}

export default function FileUploads( { histogramEndpoint }: FileUploadsProps) {

  const histogramMetadata = histogramEndpoint.metadata;
  const badpixmask_metadata = histogramMetadata?.config?.hist_format?.bad_pixel_mask?.filename as MetadataType | undefined;
  const badpixthres_metadata = histogramMetadata?.config?.thresholds?.bad_pixel?.filename as MetadataType | undefined;

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
              buttonText={histogramEndpoint.data?.config?.thresholds?.bad_pixel?.filename}
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
              buttonText={histogramEndpoint.data?.config?.hist_format?.bad_pixel_mask?.filename}
              param_metadata={badpixmask_metadata}
              loadButton
              loadPath="config/hist_format/bad_pixel_mask/load"
            />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

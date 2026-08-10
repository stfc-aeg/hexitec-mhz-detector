import { Row, Col, Card, Form, Accordion } from 'react-bootstrap';
import { FilePicker } from '../FilePicker';
import type { HistogramTypes } from '../../EndpointTypes';
import type { AdapterEndpoint } from 'odin-react';

interface FileUploadsProps {
  histogramEndpoint: AdapterEndpoint<HistogramTypes>;
  isCustom: boolean;
}

export default function FileUploads( { histogramEndpoint, isCustom }: FileUploadsProps) {

  const histogramMetadata = histogramEndpoint.metadata;
  const linearity_metadata = histogramMetadata?.config?.linearity_correction?.lin_filename;
  const linearity_gain_metadata = histogramMetadata?.config?.linearity_correction?.gain_filename;

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
            <Form.Label>Global HDF Upload</Form.Label>
            <FilePicker
              endpoint={histogramEndpoint}
              fullpath="config/hdf_settings/filename"
              buttonText={histogramEndpoint.data?.config?.hdf_settings?.filename ?? ""}
              select_options={histogramEndpoint?.data?.config?.hdf_settings?.available ?? []}
              loadButton
              loadPath="config/hdf_settings/load"
              disabled={!isCustom}
            />
          </Col>
        </Row>
        <Row className="mb-3">
          <Col>
            <Form.Label>Linearity File Upload</Form.Label>
            <FilePicker
              endpoint={histogramEndpoint}
              fullpath="config/linearity_correction/lin_filename"
              buttonText={histogramEndpoint.data?.config?.linearity_correction?.lin_filename ?? ""}
              select_options={linearity_metadata?.allowed_values ?? []}
              loadButton
              loadPath="config/linearity_correction/lin_load"
              disabled={!isCustom}
            />
          </Col>
        </Row>
        <Row className="mb-3">
          <Col>
            <Form.Label>Linearity Gain File Upload</Form.Label>
            <FilePicker
              endpoint={histogramEndpoint}
              fullpath="config/linearity_correction/gain_filename"
              buttonText={histogramEndpoint.data?.config?.linearity_correction?.gain_filename ?? ""}
              select_options={linearity_gain_metadata?.allowed_values ?? []}
              loadButton
              loadPath="config/linearity_correction/gain_load"
              disabled={!isCustom}
            />
          
          </Col>
        </Row>
        <Row className="mb-3">
          <Col>
            <Form.Label>Bad Pixel Thresholds File load</Form.Label>
            <FilePicker
              endpoint={histogramEndpoint}
              fullpath="config/thresholds/bad_pixel/filename"
              buttonText={histogramEndpoint.data?.config?.thresholds?.bad_pixel?.filename ?? ""}
              select_options={badpixthres_metadata?.allowed_values ?? []}
              loadButton
              loadPath="config/thresholds/bad_pixel/load"
              disabled={!isCustom}
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
              select_options={badpixmask_metadata?.allowed_values ?? []}
              loadButton
              loadPath="config/hist_format/bad_pixel_mask/load"
              disabled={!isCustom}
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
                  select_options={l3file_metadata?.allowed_values ?? []}
                  loadButton
                  loadPath="config/charge_sharing/l3_load"
                  disabled={!isCustom}
                />
              </Row>
              <Row className="mb-2">
                <Form.Label>MC File load</Form.Label>
                <FilePicker
                  endpoint={histogramEndpoint}
                  fullpath="config/charge_sharing/mc_filename"
                  buttonText={histogramEndpoint.data?.config?.charge_sharing?.mc_filename ?? ""}
                  select_options={mcfile_metadata?.allowed_values ?? []}
                  loadButton
                  loadPath="config/charge_sharing/mc_load"
                  disabled={!isCustom}
                />
              </Row>
              <Row className="mb-2">
                <Form.Label>Pos File load</Form.Label>
                <FilePicker
                  endpoint={histogramEndpoint}
                  fullpath="config/charge_sharing/pos_filename"
                  buttonText={histogramEndpoint.data?.config?.charge_sharing?.pos_filename ?? ""}
                  select_options={posfile_metadata?.allowed_values ?? []}
                  loadButton
                  loadPath="config/charge_sharing/pos_load"
                  disabled={!isCustom}
                />
              </Row>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Card.Body>
    </Card>
  );
}

import { Container, Row, Col, Card, Form, Button, InputGroup, FloatingLabel } from 'react-bootstrap';
import { useAdapterEndpoint, WithEndpoint } from 'odin-react';
import type { HistogramTypes, MetadataType } from '../EndpointTypes';
import { UserAware } from '../components/UserAware';
import React, { useState, useEffect } from "react";
import { FilePicker } from '../components/FilePicker';
import { floatingInputStyle } from '../utils';

interface ProcessingProps {
  endpoint_url: string;
}

const EndpointCheck = WithEndpoint(Form.Check);
const EndpointFormControl = WithEndpoint(Form.Control);
const EndpointSelect = WithEndpoint(Form.Select);

function Processing({ endpoint_url }: ProcessingProps) {
  const histogramEndpoint = useAdapterEndpoint<HistogramTypes>('histogram', endpoint_url, 500);

  const histogramMetadata = histogramEndpoint.metadata as HistogramTypes|undefined;
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
        {/* File Uploads - Power User Only */}
        <Col md={6}>
          <UserAware userLevel="power" endpoint_url={endpoint_url}>
            <Card className="mb-3">
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
            </Card>
          </UserAware>
        </Col>

        {/* Processing Settings */}
        <Col md={6}>
          <Card className="mb-3">
            <Card.Header><strong>Processing Settings</strong></Card.Header>
            <Card.Body>
              <UserAware userLevel="basic" endpoint_url={endpoint_url}>
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
              </UserAware>

              <UserAware userLevel="power" endpoint_url={endpoint_url}>
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
                            value={histogramEndpoint.data?.config.baseline?.divide}
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
                    <Row className="mb-3">
                      <Col>
                        <InputGroup>
                          <InputGroup.Text className="justify-content-center" style={{width:'33%'}}>Baseline Mask</InputGroup.Text>
                          <EndpointSelect
                            endpoint={histogramEndpoint}
                            fullpath={"config/baseline/mask"}
                            value={histogramEndpoint.data?.config.baseline?.mask}
                          >
                            {(baselinemask_metadata?.allowed_values ?? []).map(
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
              <UserAware userLevel="basic" endpoint_url={endpoint_url}>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Timing Resolution</Form.Label>
                    <Form.Control type="number" defaultValue="1" />
                    <Form.Text className="text-muted">Value (s) between accepted min/maxs</Form.Text>
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

export default Processing;
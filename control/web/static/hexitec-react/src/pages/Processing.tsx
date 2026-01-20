import { Container, Row, Col, Card, Form, Button, InputGroup } from 'react-bootstrap';
import { useAdapterEndpoint, WithEndpoint } from 'odin-react';
import type { HistogramTypes } from '../EndpointTypes';
import { UserAware } from '../components/UserAware';
import React, { useState, useEffect } from "react";

interface ProcessingProps {
  endpoint_url: string;
}

interface ThresholdPairProps {
  label: string;
  endpoint: any;
  path: string;
  initialMin?: number;
  initialMax?: number;
}

// Component for editing a pair of thresholds (min and max) to save space
function ThresholdPair({
  label,  // low, main, absolute
  endpoint,
  path,
  // initial values are optional - used if no value can be found on endpoint
  initialMin=0,
  initialMax=10
}: ThresholdPairProps) {
  const endpointPair = endpoint?.data?.config?.thresholds?.[label.toLowerCase()];

  const [min, setMin] = useState(endpointPair?.[0] ?? initialMin);
  const [max, setMax] = useState(endpointPair?.[1] ?? initialMax);
  const [changed, setChanged] = useState(false);

  const changedStyle: React.CSSProperties = {
    backgroundColor: "var(--bs-highlight-bg)",
    color: "var(--bs-body-color)",
  };

  const componentPair: [number, number] = [min, max];

  useEffect(() => {
    if (!endpointPair || min == null || max == null) {
      setChanged(false);
      return;
    }

  setChanged(
    min !== endpointPair[0] ||
    max !== endpointPair[1]
  );
  }, [min, max, endpointPair]);

  // Would do this with EndpointButton but need to pass both min and max together
  const submitPair = () => {
    console.log(min, max);
    endpoint.put(componentPair, path)
  };

  return (
    <InputGroup className="mb-2 align-items-center">
      <Form.Control
        type="number"
        value={min}
        style={changed ? changedStyle : {}}
        onChange={(e) => {
          setMin(Number(e.target.value));
        }}
      />
      <InputGroup.Text className="fw-semibold">
        {label}
      </InputGroup.Text>
      <Form.Control
        type="number"
        value={max}
        style={changed ? changedStyle : {}}
        onChange={(e) => {
          setMax(Number(e.target.value));
        }}
      />
      <Button
        variant={changed ? "primary" : "outline-secondary"}
        onClick={submitPair}
        disabled={!changed}
      >
        Apply Pair
      </Button>
    </InputGroup>
  );
}

const EndpointCheck = WithEndpoint(Form.Check);

function Processing({ endpoint_url }: ProcessingProps) {
  const histogramEndpoint = useAdapterEndpoint<HistogramTypes>('histogram', endpoint_url, 500);

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
                    <Form.Control type="file" accept=".csv" />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Intercepts Upload</Form.Label>
                    <Form.Control type="file" accept=".csv" />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Thresholds Upload</Form.Label>
                    <Form.Control type="file" accept=".csv" />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Pixel Mask Upload</Form.Label>
                    <Form.Control type="file" accept=".csv" />
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
                    <EndpointCheck
                      endpoint={histogramEndpoint}
                      fullpath="config/charge_sharing/positive_edge"
                      type="switch"
                      label="Positive Edge"
                    />
                    <EndpointCheck
                      endpoint={histogramEndpoint}
                      fullpath="config/charge_sharing/negative_neighbour"
                      type="switch"
                      label="Negative Neighbour"
                    />
                    <EndpointCheck
                      endpoint={histogramEndpoint}
                      fullpath="config/charge_sharing/position_adjust"
                      type="switch"
                      label="Position Adjust"
                    />
                    <EndpointCheck
                      endpoint={histogramEndpoint}
                      fullpath="config/charge_sharing/sum_enable"
                      type="switch"
                      label="Sum Enable"
                    />
                  </Col>
                </Row>
              </UserAware>

              <UserAware userLevel="power" endpoint_url={endpoint_url}>
                <Row className="mb-3">
                  <Col sm={6}>
                    <Form.Label>Dark Tracking</Form.Label>
                    <Form.Check type="switch" id="dark-tracking" label="On" defaultChecked disabled/>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col>
                    <Form.Label><b>Thresholds Global</b></Form.Label>
                    {/* These are min/max pairs */}
                     <ThresholdPair
                      label="Low"
                      endpoint={histogramEndpoint}
                      path="config/thresholds/low"
                    />
                    <ThresholdPair
                      label="Main"
                      endpoint={histogramEndpoint}
                      path="config/thresholds/main"
                    />
                    <ThresholdPair
                      label="Absolute"
                      endpoint={histogramEndpoint}
                      path="config/thresholds/absolute"
                    />
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
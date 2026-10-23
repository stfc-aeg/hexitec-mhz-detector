import React, { useState, useEffect } from 'react';
import { EndpointButton, type AdapterEndpoint } from '@dssg/odin-react';;
import { Form, Row, Col, InputGroup } from 'react-bootstrap';

type Region2D = [[number, number], [number, number]];

interface RegionSelectionInputProps {
  imageWidth: number;   // e.g. 80
  imageHeight: number;  // e.g. 80
  value?: Region2D | [] | null; // initial region from endpoint
  endpoint: AdapterEndpoint;
  fullpath: string;
}

export function RegionSelectionInput({
  imageWidth,
  imageHeight,
  value,
  endpoint,
  fullpath,
}: RegionSelectionInputProps) {
  const [x1, setX1] = useState(0);
  const [y1, setY1] = useState(0);
  const [x2, setX2] = useState(imageWidth);
  const [y2, setY2] = useState(imageHeight);
  const [changed, setChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Sync with endpoint value
  useEffect(() => {
    if (isEditing) return;
    if (!value || value.length === 0) {
      setX1(0);
      setY1(0);
      setX2(imageWidth);
      setY2(imageHeight);
      setChanged(false);
      return;
    }
    setX1(value[0][0] * imageWidth);
    setX2(value[0][1] * imageWidth);
    setY1(value[1][0] * imageHeight);
    setY2(value[1][1] * imageHeight);
    setChanged(false);
  }, [value, imageWidth, imageHeight]);

  // Check if local values differ from endpoint
  useEffect(() => {
    if (!value || value.length === 0) {
      setChanged(x1 !== 0 || x2 !== imageWidth || y1 !== 0 || y2 !== imageHeight);
      return;
    }

    setChanged(
      x1 !== value[0][0] * imageWidth ||
      x2 !== value[0][1] * imageWidth ||
      y1 !== value[1][0] * imageHeight ||
      y2 !== value[1][1] * imageHeight
    );
  }, [x1, x2, y1, y2, value, imageWidth, imageHeight]);

  const getNormalizedRegion = (): Region2D => {
    const xMin = Math.max(0, Math.min(x1, x2));
    const xMax = Math.min(imageWidth, Math.max(x1, x2));
    const yMin = Math.max(0, Math.min(y1, y2));
    const yMax = Math.min(imageHeight, Math.max(y1, y2));

    const region: Region2D = [
      [xMin / imageWidth, xMax / imageWidth],
      [yMin / imageHeight, yMax / imageHeight],
    ];
    return region;
  };

  const clearRegion = () => {
    setX1(0); setY1(0);
    setX2(imageWidth); setY2(imageHeight);
  };

  const changedStyle: React.CSSProperties = {
    backgroundColor: "var(--bs-highlight-bg)",
  };

  return (
    <div>
      <Form.Label className="fw-semibold">Manual Region Selection (0-80 pixels)</Form.Label>
      <Row className="mb-1 g-2">
        <Col>
          <InputGroup>
            <InputGroup.Text>x1</InputGroup.Text>
            <Form.Control
              type="number"
              value={x1}
              min={0} max={imageWidth}
              placeholder="x1"
              style={changed ? changedStyle : {}}
              onChange={e => {
                setIsEditing(true);
                setX1(Number(e.target.value));
              }}
            />
          </InputGroup>
        </Col>
        <Col>
          <InputGroup>
            <InputGroup.Text>y1</InputGroup.Text>
            <Form.Control
              type="number"
              value={y1}
              min={0} max={imageHeight}
              placeholder="y1"
              style={changed ? changedStyle : {}}
              onChange={e => {
                setIsEditing(true);
                setY1(Number(e.target.value));
              }}
            />
          </InputGroup>
        </Col>
      </Row>

      <Row className="mb-2 g-2">
        <Col>
          <InputGroup>
            <InputGroup.Text>x2</InputGroup.Text>
            <Form.Control
              type="number"
              value={x2}
              min={0} max={imageWidth}
              placeholder="x2"
              style={changed ? changedStyle : {}}
              onChange={e => {
                setIsEditing(true);
                setX2(Number(e.target.value));
              }}
            />
          </InputGroup>
        </Col>
        <Col>
          <InputGroup>
            <InputGroup.Text>y2</InputGroup.Text>
            <Form.Control
              type="number"
              value={y2}
              min={0} max={imageHeight}
              placeholder="y2"
              style={changed ? changedStyle : {}}
              onChange={e => {
                setIsEditing(true);
                setY2(Number(e.target.value));
              }}
            />
          </InputGroup>
        </Col>
      </Row>

      <div className="d-flex gap-2">
        <EndpointButton
          endpoint={endpoint}
          fullpath={fullpath}
          value={getNormalizedRegion()}
          post_method={() => setIsEditing(false)}
          className="btn-sm"
          variant={changed ? "primary" : "outline-secondary"}
          disabled={!changed}
        >
          Apply
        </EndpointButton>
        <EndpointButton
          endpoint={endpoint}
          fullpath={fullpath}
          value={[]}
          pre_method={clearRegion}
          post_method={() => setIsEditing(false)}
          className="btn-sm btn-secondary"
        >
          Clear
        </EndpointButton>
      </div>
    </div>
  );
}

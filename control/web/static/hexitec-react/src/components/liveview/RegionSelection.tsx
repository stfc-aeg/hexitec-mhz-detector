import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, InputGroup } from 'react-bootstrap';

interface RegionSelectionInputProps {
  imageWidth: number;   // e.g. 80
  imageHeight: number;  // e.g. 80
  value?: [[number, number], [number, number]]; // initial region from endpoint
  onApply: (region: [[number, number], [number, number]] | null) => void;
}

export function RegionSelectionInput({
  imageWidth,
  imageHeight,
  value,
  onApply,
}: RegionSelectionInputProps) {
  const [x1, setX1] = useState(0);
  const [y1, setY1] = useState(0);
  const [x2, setX2] = useState(imageWidth);
  const [y2, setY2] = useState(imageHeight);
  const [changed, setChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Sync with endpoint value
  useEffect(() => {
    if (!value) return;
    if (isEditing) return;
    setX1(value[0][0] * imageWidth);
    setX2(value[0][1] * imageWidth);
    setY1(value[1][0] * imageHeight);
    setY2(value[1][1] * imageHeight);
    setChanged(false);
  }, [value, imageWidth, imageHeight]);

  // Check if local values differ from endpoint
  useEffect(() => {
    if (!value) {
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

  const applyRegion = () => {
    const xMin = Math.max(0, Math.min(x1, x2));
    const xMax = Math.min(imageWidth, Math.max(x1, x2));
    const yMin = Math.max(0, Math.min(y1, y2));
    const yMax = Math.min(imageHeight, Math.max(y1, y2));

    const region: [[number, number], [number, number]] = [
      [xMin / imageWidth, xMax / imageWidth],
      [yMin / imageHeight, yMax / imageHeight],
    ];
    setIsEditing(false);
    onApply(region);
  };

  const clearRegion = () => {
    setX1(0); setY1(0);
    setX2(imageWidth); setY2(imageHeight);
    onApply(null);
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
        <Button
          className="btn-sm"
          variant={changed ? "primary" : "outline-secondary"}
          disabled={!changed}
          onClick={applyRegion}
        >
          Apply
        </Button>
        <Button className="btn-sm btn-secondary" onClick={clearRegion}>
          Clear
        </Button>
      </div>
    </div>
  );
}

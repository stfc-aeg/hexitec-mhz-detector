import React, { useEffect, useState } from 'react';
import { EndpointButton, type AdapterEndpoint } from '@dssg/odin-react';;
import { Form, Row, Col } from 'react-bootstrap';

interface MinMaxInputProps {
  label?: string;
  value: [number, number];
  endpoint: AdapterEndpoint;
  fullpath: string;
  minLabel?: string;
  maxLabel?: string;
  disabled?: boolean;
}

export function MinMaxInput({
  label,
  value,
  endpoint,
  fullpath,
  minLabel = 'Min',
  maxLabel = 'Max',
  disabled = false,
}: MinMaxInputProps) {
  const [localMin, setLocalMin] = useState(value[0]);
  const [localMax, setLocalMax] = useState(value[1]);
  const [changed, setChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isEditing) return;
    setLocalMin(value[0]);
    setLocalMax(value[1]);
    setChanged(false);
  }, [value]);

  useEffect(() => {
    setChanged(localMin !== value[0] || localMax !== value[1]);
  }, [localMin, localMax, value]);

  const changedStyle: React.CSSProperties = {
    backgroundColor: "var(--bs-highlight-bg)",
  };

  return (
    <Form className="mb-2" onSubmit={(event) => event.preventDefault()}>
      <Row className="mb-1">
        <Col className="text-left">
          <div className="fw-semibold">
            {label ?? `${minLabel} / ${maxLabel}`}
          </div>
        </Col>
      </Row>

      <Row className="g-0 align-items-stretch">
        <Col xs={6} sm={4}>
          <Form.Control
            type="number"
            value={localMin}
            placeholder={minLabel}
            style={{
              ...(changed ? changedStyle : {}),
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}   
            onChange={(e) => {
              setIsEditing(true);
              setLocalMin(Number(e.target.value))
            }}
            onFocus={() => setIsEditing(true)}
            disabled={disabled}
          />
        </Col>
        {/* These border styles are to simulate an 'InputGroup' 
        At small screen sizes, this is sacrificed to make the buttons readable */}
        <Col xs={6} sm={4}>
          <Form.Control
            type="number"
            value={localMax}
            placeholder={maxLabel}
            style={{
              ...(changed ? changedStyle : {}),
              borderRadius: 0,
              borderLeft: 0,
            }}
            onChange={(e) => {
              setIsEditing(true);
              setLocalMax(Number(e.target.value))
            }}
            onFocus={() => setIsEditing(true)}
            disabled={disabled}
          />
        </Col>

        <Col xs={4}>
          <EndpointButton
            endpoint={endpoint}
            fullpath={fullpath}
            value={[localMin, localMax]}
            post_method={() => setIsEditing(false)}
            type="submit"
            className="w-100 h-100"
            variant={changed ? "primary" : "outline-secondary"}
            disabled={!changed || disabled}
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
          >
            Apply
          </EndpointButton>
        </Col>
      </Row>
    </Form>
  );
}

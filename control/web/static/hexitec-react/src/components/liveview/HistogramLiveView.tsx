import React, { useState, useEffect } from 'react';
import { useAdapterEndpoint } from 'odin-react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import { TitleCard, WithEndpoint } from 'odin-react';
import { ColourScale } from './ColourScale';
import { MinMaxInput } from '../MinMaxInput';
import { ClickableImage } from './ClickableImage';
import { checkNull, floatingInputStyle, floatingLabelStyle } from '../../utils'
import type { MetadataType } from '../../EndpointTypes';

import type { ParamTree } from 'odin-react';
import { RegionSelectionInput } from './RegionSelection';

export interface HistogramRegion extends ParamTree {
  x: [number, number];
  y: [number, number];
  width: number;
  height: number;
}

// Derived from processor.py
export interface HistogramData extends ParamTree {
  counts: number[];
  bins: number[];
  mean: number;
  std: number;
  min: number;
  max: number;
  region: HistogramRegion;
}

interface LiveViewTypes extends ParamTree {
    histview: {
      [detectorName: string]: {
        endpoint: string;
        image: {
          colour: string;
          data: any | null;
          energy_range: [number, number];
          num_bins: number;
          histograms: any | null;
          region: [[number, number],[number, number]];
          scale: number;
          value_range: [number, number];
          occupancy_percent: number;
          occupancy_threshold: number;
        };
      }
    };
    _image: {
      [detectorName: string]: {
        image: undefined;
        histogram: undefined;
      }
    };
}

const EndpointButton = WithEndpoint(Button);

interface HistogramLiveViewProps {
  endpoint_url: string;
  name: string;
}

export function HistogramLiveView({ endpoint_url, name }: HistogramLiveViewProps) {
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('');

  const liveViewEndPoint = useAdapterEndpoint<LiveViewTypes>('liveview', endpoint_url, 1000);

  // const histogramViewEndpoint = useAdapterEndpoint<HistogramEndpointTypes>(`liveview/_image/${name}/histograms`, endpoint_url, 1000);
  const liveViewData = liveViewEndPoint?.data?.histview?.[name];
  const imgPath = `histview/${name}/image`;

  // This appears as the ranges stuck together so it needs formatting into (x - y)
  const energyRange = `(0 - ${liveViewData?.image['num_bins'] -1})`;

  const liveViewMetadata = liveViewEndPoint?.metadata as LiveViewTypes|undefined;
  const colour_metadata = liveViewMetadata?.histview?.[name]?.image?.colour as MetadataType|undefined;

  // Timer effects remain the same...
  useEffect(() => {
    if (liveViewData?.image?.data) {
      setLastUpdateTime(Date.now());
    }
  }, [liveViewData?.image?.data]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (lastUpdateTime) {
        const diff = Date.now() - lastUpdateTime;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        setTimeSinceUpdate(
          `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
        );
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [lastUpdateTime]);

  // function to send histogram region selection
  const handleHistSelection = (coords: [[number, number], [number, number]] | null) => {
    if (!coords) {
      liveViewEndPoint.put(
        { energy_range: [] }, imgPath
      );
      return;
    };

    // y-axis is maximised so can be ignored
    const [xMinNorm, xMaxNorm] = coords[0];
    const numBins = liveViewData?.image['num_bins'];

    if (!numBins) return;

      // Get current range so selection works within existing range instead of overriding it
      const currentRange = liveViewData?.image?.energy_range;
      const currentMin = currentRange?.[0] ?? 0;
      const currentMax = currentRange?.[1] ?? numBins -1; // Default is full range 0-(num_bins-1)

      const currentWidth = currentMax - currentMin +1;

      let binMin = Math.floor(currentMin + xMinNorm * currentWidth); // min + (0->1)*(max-min)
      let binMax = Math.floor(currentMin + xMaxNorm * currentWidth) // this is always in prev range

      // Clamp to valid range
      binMin = Math.max(0, Math.min(binMin, numBins - 1));
      binMax = Math.max(0, Math.min(binMax, numBins - 1));

      // Ensure correct ordering
      if (binMin > binMax) {
        [binMin, binMax] = [binMax, binMin];
      }
      liveViewEndPoint.put(
        { energy_range: [binMin, binMax] },
        imgPath
      );
  };

  const getOccupancyStyle = (
    value?: number,
    threshold?: number
  ) => {
    if (value == null || threshold == null ) return floatingLabelStyle;

    // Other styles will be based off of floatingLabelStyle but with different colours
    if (value >= threshold) {
      return {
        border: '1px solid #992732',
        backgroundColor: '#f8d7da',
        borderRadius: '0.375rem'
      }; // exceeds threshold: red
    }

    if (value >= 0.8*threshold) {
      return {
        border: '1px solid #dfb600',
        backgroundColor: '#f8f5d7',
        borderRadius: '0.375rem'
      }; // top 20% of threshold: warning yellow
    }

    return floatingLabelStyle; // default blue
  }

  return (
    <TitleCard title={`Histogram View - ${name}`}>
      <Container fluid>
        {/* Timer Display */}
        <Row className="mb-3">
          <Col>
            <div className="d-flex justify-content-end">
              <span className={`text-muted ${!lastUpdateTime ? 'text-danger' : ''}`}>
                Last update: {timeSinceUpdate ? timeSinceUpdate : 'Never'}
              </span>
            </div>
          </Col>
        </Row>

        {/* Main Content */}
        <Row>
          {/* Left Column - Image and Controls */}
          <Col xs={12} md={3} className="mb-4 justify-content-center">
            <div className="d-flex">

              {/* Color scale */}
              <div className="me-3">
                <MinMaxInput
                  label="Value Range"
                  value={liveViewData?.image?.value_range ?? [0,1000]}
                  onApply={(range) => {
                    liveViewEndPoint.put(
                      { value_range: range }, imgPath
                    );
                  }}
                />
                <EndpointButton
                  endpoint={liveViewEndPoint}
                  fullpath={`${imgPath}/value_range`}
                  value={[]}
                  variant='outline-primary'
                  style={{width:30}}
                >
                  Reset Value Range
                </EndpointButton>
                <ColourScale 
                  min={liveViewData?.image?.value_range[0] ?? 0}
                  max={liveViewData?.image?.value_range[1] ?? 1000}
                  colormap={liveViewData?.image?.colour || 'bone'}
                />
                <FloatingLabel
                  label="Colourmap" className="mt-3">
                  <Form.Select
                    style={floatingInputStyle}
                    value={liveViewData?.image?.colour || 'Select a colour'}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>)=> {
                      let selectedColour = e.currentTarget.value;
                      liveViewEndPoint.put(selectedColour, `${imgPath}/colour`);
                    }}>
                    {(colour_metadata?.allowed_values || ['?']).map((effect:string, index:number) => (
                      <option key={index} value={effect}>
                        {effect}
                      </option>
                    ))}
                  </Form.Select>
                </FloatingLabel>
              </div>
            </div>
          </Col>
          <Col md={9}>
            <Row className="mb-3">
              <Col> {/* Counts map and histogram */}
                <Row>
                  <Col xs={6} className="justify-content-left">
                    <label className="text-muted">0</label>
                  </Col>
                  <Col xs={6} className="text-end">
                    <label className="text-muted">80</label>
                  </Col>
                </Row>
                <div style={{position:'relative', width: '100%', position: 'relative'}}>
                  <div
                    style={{
                      position: 'absolute',
                      left: -20,
                      top: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      fontSize: '1rem',
                      color: 'rgba(0,0,0,0.75)',
                      pointerEvents: 'none'
                    }}>
                      <span>0</span>
                      <span>80</span>
                  </div>
                  <ClickableImage
                    endpoint={liveViewEndPoint}
                    imgPath={`_image/${name}/counts`}
                    coordsPath={`histview/${name}/image/`}
                    coordsParam={'region'}
                    region={liveViewData?.image?.region ?? null}
                  />
                </div>
              </Col>
              <Col>
                <Row>
                  <RegionSelectionInput
                    imageHeight={80}
                    imageWidth={80}
                    value={liveViewData?.image?.region || undefined}
                    onApply={(region) => liveViewEndPoint.put({ 'region': region}, imgPath)}
                  />
                </Row>
                <Row className="mt-3">
                  <Col>
                    <FloatingLabel label="Occupancy %">
                      <Form.Control
                        value={checkNull(liveViewData?.image?.occupancy_percent)}
                        disabled
                        style={getOccupancyStyle(
                          liveViewData?.image?.occupancy_percent,
                          liveViewData?.image?.occupancy_threshold
                        )}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row>
              <Col> 
                <ClickableImage
                  endpoint={liveViewEndPoint}
                  imgPath={`_image/${name}/histogram`}
                  onSelection={handleHistSelection}
                  maximiseAxis={'y'}
                  rectOutlineColour='black'
                  rectRgbaProperties='rgba(50,50,50,0.05)'
                  rectDisappears={true}
                />
              </Col>
              <Col>
                <Row>
                  <MinMaxInput
                    label={`Manual Energy Bin Range ${energyRange}`}
                    value={liveViewData?.image?.energy_range || [0, 0]}
                    onApply={(range) => {
                      liveViewEndPoint.put(
                        { energy_range: range }, imgPath
                      );
                    }}
                  />
                </Row>
                <Row>
                  <Col className="justify-content-end">
                    <EndpointButton
                      endpoint={liveViewEndPoint}
                      fullpath={`${imgPath}/energy_range`}
                      value={null}
                      variant='outline-primary'
                      style={{width:30}}
                    >
                      Reset Energy Range
                    </EndpointButton>
                  </Col>
                </Row>
              </Col>
            </Row>     
          </Col>
        </Row>
      </Container>
    </TitleCard>

  );
}

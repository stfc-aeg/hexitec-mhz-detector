import React, { useState, useEffect } from 'react';
import { useAdapterEndpoint } from 'odin-react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import { 
  TitleCard,
  OdinDoubleSlider,
  WithEndpoint 
} from 'odin-react';
import { ValueRangeControl } from './ValueRangeControl';
import { ClickableImage } from './ClickableImage';
import { floatingInputStyle } from '../../utils'
import type { MetadataType } from '../../EndpointTypes';

import type { ParamTree } from 'odin-react';

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
          energy_range: number[];
          num_bins: number;
          histograms: any | null;
          region: any;
          scale: number;
          value_range: number[];
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


const EndPointDoubleSlider = WithEndpoint(OdinDoubleSlider);

interface HistogramLiveViewProps {
  endpoint_url: string;
  name: string;
}

export function HistogramLiveView({ endpoint_url, name }: HistogramLiveViewProps) {
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('');
  const [colorRange, setColorRange] = useState<[number, number]>([0, 1000]);

  const liveViewEndPoint = useAdapterEndpoint<LiveViewTypes>('liveview', endpoint_url, 1000);

  // const histogramViewEndpoint = useAdapterEndpoint<HistogramEndpointTypes>(`liveview/_image/${name}/histograms`, endpoint_url, 1000);
  const liveViewData = liveViewEndPoint?.data?.histview?.[name];
  const imgPath = `histview/${name}/image`;

  // This appears as the ranges stuck together so it needs formatting into (x - y)
  const energyRange = `(0 - ${liveViewData?.image['num_bins'] -1})`;

  const liveViewMetadata = liveViewEndPoint?.metadata as LiveViewTypes|undefined;
  const colour_metadata = liveViewMetadata?.histview?.[name]?.image?.colour as MetadataType|undefined;

  const handleColorRangeChange = (newRange: [number, number]) => {
    setColorRange(newRange);
    liveViewEndPoint.put({ 
      value_range: newRange
    }, imgPath);
  };

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
  const handleHistSelection = (coords: [[number, number], [number, number]]) => {
    // y-axis is maximised so can be ignored
    const [xMinNorm, xMaxNorm] = coords[0];
    const numBins = liveViewData?.image['num_bins'];

    if (!numBins) return;

      // Convert normalized coords → bin indices
      let binMin = Math.floor(xMinNorm * numBins);
      let binMax = Math.floor(xMaxNorm * numBins);

      // Clamp to valid range
      binMin = Math.max(0, Math.min(binMin, numBins - 1));
      binMax = Math.max(0, Math.min(binMax, numBins - 1));

      // Ensure correct ordering
      if (binMin > binMax) {
        [binMin, binMax] = [binMax, binMin];
      }
      liveViewEndPoint.put(
        { energy_range: [binMin, binMax] },
        `histview/${name}/image`
      );
  };

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
          <Col xs={12} md={3} className="mb-4">
            <div className="d-flex">

              {/* Color scale */}
              <div className="me-3">
                <ValueRangeControl 
                  min={colorRange[0]}
                  max={colorRange[1]}
                  colormap={liveViewData?.image?.colour || 'bone'}
                  onRangeChange={handleColorRangeChange}
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

            {/* ClickableImages */}
            <Row>
              <Col> {/* Counts map */}
                <ClickableImage
                  endpoint={liveViewEndPoint}
                  imgPath={`_image/${name}/image`}
                  coordsPath={`histview/${name}/image/`}
                  coordsParam={'region'}
                />
              </Col>
              <Col> {/* 1D histogram */}
                <ClickableImage
                  endpoint={liveViewEndPoint}
                  imgPath={`_image/${name}/histogram`}
                  onSelection={handleHistSelection}
                  maximiseAxis={'y'}
                />
                
              </Col>
            </Row>
            {/* Image Controls */}
            <Row>
              <Col>
              </Col>
              <Col>
                <div className="mt-3">
                  <Form.Group>
                    <Form.Label>Energy Bin Range Selection {energyRange}</Form.Label>
                    <EndPointDoubleSlider
                      endpoint={liveViewEndPoint}
                      fullpath={`${imgPath}/energy_range`}
                      min={0}
                      max={liveViewData?.image['num_bins'] - 1}
                      step={1}
                      title="Energy Bins"
                      value={liveViewData?.image?.energy_range}
                    />
                  </Form.Group>
                </div>
              </Col>
            </Row>
                
          </Col>
        </Row>
      </Container>
    </TitleCard>

  );
}

import React, { useState, useEffect } from 'react';
import { useAdapterEndpoint } from 'odin-react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import { 
  TitleCard,
  OdinDoubleSlider,
  WithEndpoint 
} from 'odin-react';
import { getRegionColor } from './colorUtils';
import { ValueRangeControl } from './ValueRangeControl';
import { ClickableImage } from './ClickableImage';
import { HistogramPlot } from './HistogramPlot';
import { floatingInputStyle } from '../../utils'

import type { ParamTree } from 'odin-react';

export interface HistogramRegion {
  x: [number, number];
  y: [number, number];
  width: number;
  height: number;
}

// Derived from processor.py
export interface HistogramData {
  counts: number[];
  bins: number[];
  mean: number;
  std: number;
  min: number;
  max: number;
  region: HistogramRegion;
}

interface LiveViewTypes extends ParamTree {
    endpoint: string;
    image: {
      colour: string;
      data: any | null;
      energy_range: number[];
      histograms: any | null;
      regions: any;
      scale: number;
      size_x: number;
      size_y: number;
      value_range: number[];
    };
}

const EndPointDoubleSlider = WithEndpoint(OdinDoubleSlider);

function getGridLayout(count: number) {
  if (count <= 1) return { cols: 1 };
  if (count === 2) return { cols: 2 };
  return { cols: 2 }; // 2 columns for 3 or more histograms
}

interface HistogramLiveViewProps {
  endpoint_url: string;
  name: string;
}

export function HistogramLiveView({ endpoint_url, name }: HistogramLiveViewProps) {
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('');
  const [colorRange, setColorRange] = useState<[number, number]>([0, 1000]);

  const liveViewAddress = `liveview/histview/${name}`;
  const liveViewEndPoint = useAdapterEndpoint<LiveViewTypes>(liveViewAddress, endpoint_url, 1000);
  const liveViewData = liveViewEndPoint?.data?.[name] as LiveViewTypes|undefined;

  const liveViewMetadata = liveViewEndPoint?.metadata as LiveViewTypes|undefined;
  const colour_metadata = liveViewMetadata?.[name]?.image?.colour;

  const handleColorRangeChange = (newRange: [number, number]) => {
    setColorRange(newRange);
    liveViewEndPoint.put({ 
      value_range: newRange
    }, 'image');
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

  const histograms = Object.entries(liveViewData?.image?.histograms || {}) as [string, HistogramData][]; // regionId is a number but JS parsing
  const layout = getGridLayout(histograms.length);

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
          <Col xs={12} md={6} className="mb-4">
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
                        liveViewEndPoint.put(e.currentTarget.value, `image/colour`);
                      }}>
                      {(colour_metadata?.allowed_values || ['?']).map((effect:string, index:number) => (
                        <option key={index} value={effect}>
                          {effect}
                        </option>
                      ))}
                    </Form.Select>
                  </FloatingLabel>
              </div>

              {/* Image */}
              <div className="flex-grow-1">
                <div className="position-relative">
                  <ClickableImage
                    endpoint={liveViewEndPoint}
                    imgPath="image/data"
                    coordsPath="image"
                    coordsParam="regions"
                    regions={liveViewData?.image?.regions}
                    getRegionColor={getRegionColor}
                  />
                  <div className="mt-2 text-muted small">
                    Click and drag to select a region for histogram analysis
                  </div>
                </div>

                {/* Image Controls */}
                <div className="mt-3">
                  <Form.Group>
                    <Form.Label>Energy Bin Range Selection (0-1023)</Form.Label>
                    <EndPointDoubleSlider
                      endpoint={liveViewEndPoint}
                      fullpath="image/energy_range"
                      min={0}
                      max={1023}
                      step={1}
                      title="Energy Bins"
                      value={liveViewData?.image?.energy_range || [0, 1023]}
                    />
                  </Form.Group>
                </div>
              </div>
            </div>
          </Col>

          {/* Right Column - Histogram Grid */}
          <Col xs={12} md={6}>
            <div className="histogram-grid">
              <Row className="g-3">
                {histograms.map(([regionId, histData]) => {
                  const regionIdNum = parseInt(regionId, 10);
                  return (
                  <Col xs={12} md={layout.cols === 1 ? 12 : 6} key={regionId}>
                    <div className="position-relative">
                      <HistogramPlot 
                        histogramData={histData}
                        regionId={regionIdNum}
                        color={getRegionColor(parseInt(regionId) - 1)}
                      />
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        className="position-absolute"
                        style={{ top: '10px', right: '10px' }}
                        onClick={() => {
                          const updatedRegions = {...liveViewData?.image?.regions};
                          delete updatedRegions[regionId];
                          liveViewEndPoint.put({ regions: updatedRegions }, 'image');
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </Col>
                )})}
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </TitleCard>
  );
}

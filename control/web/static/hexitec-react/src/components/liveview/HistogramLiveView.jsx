import React, { useState, useEffect } from 'react';
import { useAdapterEndpoint } from 'odin-react';
import { Container, Row, Col, Form, InputGroup, Dropdown, Button } from 'react-bootstrap';
import { 
  TitleCard,
  OdinDoubleSlider,
  WithEndpoint 
} from 'odin-react';
import { getRegionColor } from './colorUtils';
import ValueRangeControl from './ValueRangeControl';
import ClickableImage from './ClickableImage';
import HistogramPlot from './HistogramPlot';

const EndPointDropdownSelector = WithEndpoint(Form.Select);
const EndPointDoubleSlider = WithEndpoint(OdinDoubleSlider);

function getGridLayout(count) {
  if (count <= 1) return { cols: 1 };
  if (count === 2) return { cols: 2 };
  return { cols: 2 }; // 2 columns for 3 or more histograms
}

function HistogramLiveView({ endpoint_url, name }) {
  const [lastUpdateTime, setLastUpdateTime] = React.useState(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = React.useState('');
  const [colorRange, setColorRange] = useState([0, 1000]);

  const liveViewAddress = `liveview/histview/${name}`;
  const liveViewEndPoint = useAdapterEndpoint(liveViewAddress, endpoint_url, 1000);
  const liveViewData = liveViewEndPoint?.data[name];

  const colourEffects = [
    'autumn', 'bone', 'jet', 'winter', 'rainbow', 'ocean', 'summer', 'spring',
    'cool', 'hsv', 'pink', 'hot', 'parula', 'magma', 'inferno', 'plasma',
    'viridis', 'cividis', 'twilight', 'twilight_shifted', 'turbo', 'deepgreen'
  ];

  const handleColorRangeChange = (newRange) => {
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

  const histograms = Object.entries(liveViewData?.image?.histograms || {});
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

                  <Form.Group className="mt-4">
                    <Form.Label>Colormap</Form.Label>
                    <EndPointDropdownSelector
                      endpoint={liveViewEndPoint}
                      fullpath="image/colour"
                      buttonText={liveViewData?.image?.colour || 'Select colourmap'}
                      event_type="select"
                      variant="outline-secondary"
                    >
                      {colourEffects.map((effect, index) => (
                        <Dropdown.Item key={index} eventKey={effect}>
                          {effect}
                        </Dropdown.Item>
                      ))}
                    </EndPointDropdownSelector>
                  </Form.Group>
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
                {histograms.map(([regionId, histData], index) => (
                  <Col xs={12} md={layout.cols === 1 ? 12 : 6} key={regionId}>
                    <div className="position-relative">
                      <HistogramPlot 
                        histogramData={histData}
                        regionId={regionId}
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
                ))}
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </TitleCard>
  );
}

export default HistogramLiveView;
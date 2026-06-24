import { EndpointButton, EndpointCheckbox, TitleCard, useAdapterEndpoint, WithEndpoint, type ParamNode } from 'odin-react';
import React, { useEffect, useState } from 'react';
import { Col, Container, Form, OverlayTrigger, Row } from 'react-bootstrap';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import type { AcquisitionTypes } from '../../EndpointTypes';
import { tooltips } from '../../tooltips';
import { checkNull, floatingInputStyle, floatingLabelStyle } from '../../utils';
import { MinMaxInput } from '../MinMaxInput';
import { ClickableImage } from './ClickableImage';
import { ColourScale } from './ColourScale';

import { RegionSelectionInput } from './RegionSelection';

export interface HistogramRegion extends ParamNode {
  x: [number, number];
  y: [number, number];
  width: number;
  height: number;
}

// Derived from processor.py
export interface HistogramData extends ParamNode {
  counts: number[];
  bins: number[];
  mean: number;
  std: number;
  min: number;
  max: number;
  region: HistogramRegion;
}

interface LiveViewTypes extends ParamNode {
    histview: {
      [detectorName: string]: {
        endpoint: string;
        image: {
          colour: string;
          energy_range: [number, number];
          frames_per_histogram: number;
          last_update: string;
          num_bins: number;
          region: [[number, number],[number, number]];
          scale: number;
          value_range: [number, number];
          occupancy_percent: number;
          occupancy_threshold: number;
          autoclip: boolean;
          autoclip_percent: number;
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

// const EndpointButton = WithEndpoint(Button);
const EndpointFormControl = WithEndpoint(Form.Control);

interface HistogramLiveViewProps {
  endpoint_url: string;
  name: string;
}

export function HistogramLiveView({ endpoint_url, name }: HistogramLiveViewProps) {

  const liveViewEndPoint = useAdapterEndpoint<LiveViewTypes>('liveview', endpoint_url, 1000);
  const acquisitionEndpoint = useAdapterEndpoint<AcquisitionTypes>('acquisition', endpoint_url, 2000);

  // const histogramViewEndpoint = useAdapterEndpoint<HistogramEndpointTypes>(`liveview/_image/${name}/histograms`, endpoint_url, 1000);
  const liveViewData = liveViewEndPoint?.data?.histview?.[name];
  const imgPath = `histview/${name}/image`;

  // This appears as the ranges stuck together so it needs formatting into (x - y)
  const energyRange = `(0 - ${liveViewData?.image['num_bins'] -1})`;

  const liveViewMetadata = liveViewEndPoint?.metadata;
  const colour_metadata = liveViewMetadata?.histview?.[name]?.image?.colour;

  const lastUpdate = liveViewData?.image?.last_update;

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
    <TitleCard title={
      <Row>
        <Col xs={3} className="d-flex align-items-center" style={{fontSize:'1.3rem'}}>
          <strong>{`Histogram View - ${name}`}</strong>
        </Col>
        <Col xs={2}>
          <EndpointButton
            className="h-100"
            endpoint={acquisitionEndpoint}
            fullpath="state/preview/toggle"
            value={!acquisitionEndpoint.data?.state?.preview?.toggle}
            variant={acquisitionEndpoint.data?.state?.preview?.toggle ? 'danger' : 'primary'}
            disabled={acquisitionEndpoint.data?.state?.acquisition?.toggle}
            >
              {acquisitionEndpoint.data?.state?.preview?.toggle ? 'Disable preview' : 'Enable preview'}
            </EndpointButton>
        </Col>
        <Col xs={3}>
          <FloatingLabel label="Frames per hist (for preview)">
            <EndpointFormControl
              endpoint={acquisitionEndpoint}
              fullpath="state/preview/frames_per_hist"
              style={floatingInputStyle}
            />
          </FloatingLabel>
        </Col>
      </Row>
    }>
      <Container fluid>
        {/* Timer Display */}
        <Row className="mb-3">
          <Col>
            <div className="d-flex justify-content-end">
              <span className={`text-muted `}>
                Last update: {lastUpdate ?? ''}
              </span>
            </div>
          </Col>
        </Row>

        {/* Main Content */}
        <Row>
          {/* Left Column - Image and Controls */}
          <Col xs={12} md={3} className="mb-3 justify-content-center">
            <div className="d-flex">

              {/* Color scale */}
              <div className="me-3">
                <Row>
                  <Col>
                    <EndpointButton
                      endpoint={liveViewEndPoint}
                      fullpath={`${imgPath}/autoclip`}
                      value={liveViewEndPoint?.data?.histview?.[name]?.image?.autoclip ? false : true}
                      variant={liveViewEndPoint?.data?.histview?.[name]?.image?.autoclip ? 'danger' :'primary'}
                      style={{width:30}}
                      className="mb-3"
                    >
                      {liveViewEndPoint?.data?.histview?.[name]?.image?.autoclip ? 'Disable autoclip' : 'Enable autoclip'}
                    </EndpointButton>
                  </Col>
                  <Col>
                    <FloatingLabel label="Autoclip %">
                      <EndpointFormControl
                        endpoint={liveViewEndPoint}
                        fullpath={`${imgPath}/autoclip_percent`}
                        variant='outline-primary'
                        style={{width:'30%'}}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
                <MinMaxInput
                  label="Value Range"
                  disabled={liveViewEndPoint?.data?.histview?.[name]?.image?.autoclip}
                  value={liveViewData?.image?.value_range ?? [0,1000]}
                  onApply={(range) => {
                    liveViewEndPoint.put(
                      { value_range: range }, imgPath
                    );
                  }}
                />
                <Row>
                  <Col xs={7}>
                    <EndpointButton
                      endpoint={liveViewEndPoint}
                      fullpath={`${imgPath}/value_range`}
                      value={[]}
                      variant='outline-primary'
                      style={{width:30}}
                      disabled={liveViewEndPoint?.data?.histview?.[name]?.image?.autoclip}
                    >
                      Reset Value Range
                    </EndpointButton>
                  </Col>
                  <Col>
                    <EndpointCheckbox
                      endpoint={liveViewEndPoint} fullpath={`${imgPath}/use_log_scaling`}
                      label="Use Log Scaling"
                    />
                  </Col>
                </Row>
                
                <ColourScale 
                  min={liveViewData?.image?.value_range[0] ?? 0}
                  max={liveViewData?.image?.value_range[1] ?? 1000}
                  colormap={liveViewData?.image?.colour || 'bone'}
                />
                <FloatingLabel
                  label="Colourmap" className="mt-1">
                  <Form.Select
                    style={floatingInputStyle}
                    value={liveViewData?.image?.colour || 'Select a colour'}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>)=> {
                      const selectedColour = e.currentTarget.value;
                      liveViewEndPoint.put({colour: selectedColour}, `${imgPath}`);
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
                <div style={{position:'relative', width: '100%'}}>
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
                      <span>80</span>
                      <span>0</span>
                  </div>
                  <ClickableImage
                    endpoint={liveViewEndPoint}
                    imgPath={`_image/${name}/counts`}
                    coordsPath={`histview/${name}/image/`}
                    coordsParam={'region'}
                    region={liveViewData?.image?.region ?? null}
                  />
                </div>
                <Row>
                  <Col xs={12} className="text-end">
                    <label className="text-muted">80</label>
                  </Col>
                </Row>
              </Col>
              <Col>
                <OverlayTrigger placement="top" overlay={tooltips.liveview.region_selection}>
                  <Row>
                    <RegionSelectionInput
                      imageHeight={80}
                      imageWidth={80}
                      value={liveViewData?.image?.region || undefined}
                      onApply={(region) => liveViewEndPoint.put({ 'region': region}, imgPath)}
                    />
                  </Row>
                </OverlayTrigger>
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
              <OverlayTrigger placement="bottom-end" overlay={tooltips.liveview.energybin_range}>
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
              </OverlayTrigger>
                <Row>
                  <Col className="justify-content-end">
                    <EndpointButton
                      endpoint={liveViewEndPoint}
                      fullpath={`${imgPath}/energy_range`}
                      value={[]}
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

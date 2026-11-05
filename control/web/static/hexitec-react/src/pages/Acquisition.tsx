import { EndpointButton, EndpointCheckbox, EndpointInput, EndpointSelect, TitleCard, useAdapterEndpoint } from '@dssg/odin-react';;
import { useEffect, useState } from 'react';
import { ButtonGroup, Card, Col, Container, FloatingLabel, Form, OverlayTrigger, ProgressBar, Row } from 'react-bootstrap';
import type { AcquisitionTypes, ReadoutTypes } from '../EndpointTypes';
import { tooltips } from '../tooltips';
import { checkNull, floatingInputStyle, floatingLabelStyle } from '../utils.js';

interface AcquisitionProps {
  endpoint_url: string;
}

const minimumFramesPerTimeframe: { [key: string]: number } = {
  histogram_128: 350,
  histogram_256: 700,
  histogram_512: 1400,
  histogram_1024: 2800,
  histogram_2048: 5600,
  histogram_4096: 11200
};

function Acquisition({ endpoint_url }: AcquisitionProps) {

  const acquisitionEndpoint = useAdapterEndpoint<AcquisitionTypes>('acquisition', endpoint_url, 1000);
  const readoutEndpoint = useAdapterEndpoint<ReadoutTypes>('readout', endpoint_url, 10000);

  const acquisitionData = acquisitionEndpoint?.data;

  const [triggerModeValue, setTriggerModeValue] = useState(acquisitionEndpoint.data?.config?.trigger?.device ?? 'software');
  const [adTriggerModeValue, setAdTriggerModeValue] = useState(acquisitionEndpoint.data?.config?.trigger?.trigger_mode ?? 'burst mode');

  // These values need to populate correctly to indicate the actual state of the system
  // As radio and states, they require a little more work to ensure they are in sync
  // The initial poll might be undefined and then updated on next render, this does not always work
  useEffect(() => {
    const device = acquisitionData?.config?.trigger?.device;
    const triggerMode = acquisitionData?.config?.trigger?.trigger_mode;

    if (device !== undefined) {
      setTriggerModeValue(device);
    }
    if (triggerMode !== undefined) {
      setAdTriggerModeValue(triggerMode);
    }
  }, [
    acquisitionData?.config?.trigger?.device,
    acquisitionData?.config?.trigger?.trigger_mode
  ]);

  const hists_per_acquisition = (acquisitionData?.config?.trigger?.number_of_timeframes ?? 0) * (acquisitionData?.config?.trigger?.multiple_files?.number_of_files ?? 0)

  const formatDisplayNumber = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue.toLocaleString() : String(value);
  };

  const formatMultiplierLabel = (value: unknown) => `x${formatDisplayNumber(value)}`;

  const estimatedDataRate = acquisitionData?.config?.estimated_data_rate ?? 0;
  const rateTooHigh = estimatedDataRate > 12.5;
  const framesPerTimeframe = acquisitionData?.config?.trigger?.frames_per_timeframe;
  const minimumFrames = minimumFramesPerTimeframe[acquisitionData?.config?.bin_mode ?? ''];
  const framesPerTimeframeTooLow = typeof framesPerTimeframe === 'number'
    && minimumFrames !== undefined
    && framesPerTimeframe < minimumFrames;

  const acquisitionMetadata = acquisitionEndpoint?.metadata;
  const binmode_metadata = acquisitionMetadata?.config?.bin_mode;
  const frameMultiplier_metadata = acquisitionMetadata?.config?.trigger?.frame_multiplier;

  const triggerPolarityOptions = readoutEndpoint.metadata?.trigger?.polarity;

  const isAcquiring = acquisitionData?.state?.acquisition?.toggle;
  const acquisitionProgress = acquisitionData?.state?.acquisition?.progress_task?.progress;
  const isFreerun = acquisitionData?.state?.acquisition?.freerun ?? false;
  const framesWritten = acquisitionData?.state?.acquisition?.progress_task?.frames_written ?? 0;
  const acquisitionProgressLabel = acquisitionProgress?.toString() + '%'

  const multiple_file_mode = acquisitionEndpoint?.data?.config?.trigger?.multiple_files?.enable;

  const acquisitionButtonDisabled = rateTooHigh && !isAcquiring;
  const acquisitionButtonVariant = isAcquiring ? 'danger' : rateTooHigh ? 'danger' : 'primary';
  const triggerModeRadios = [
    { name: 'Hardware', value: 'hardware' },
    { name: 'Software', value: 'software' }
  ];
  const adTriggerModeRadios = [
    { name: 'Burst',  value: 'burst mode', tooltip: tooltips.acquisition.burst_mode },
    { name: 'Step scan', value: 'step scan', tooltip: tooltips.acquisition.step_scan },
    { name: 'Continuous', value: 'continuous mode', tooltip: tooltips.acquisition.continuous_mode }
  ];
  const updateTriggerModeValue = ({ selectedValue }: { selectedValue: string }) => {
    setTriggerModeValue(selectedValue);
  };

  const updateAdTriggerModeValue = ({ selectedValue }: { selectedValue: string }) => {
    setAdTriggerModeValue(selectedValue);
  };

  const est_duration = (((acquisitionData?.config?.trigger?.frames_per_timeframe ?? 0) * (acquisitionData?.config?.trigger?.number_of_timeframes ?? 0)) / 1000000);

  // need to map histogram bin modes to numbers
  // labels are in form histogram_X where X is number of bins, but we only want '<number> bins' for dropdown
  const binModeOptions: { [key: string]: string } = {
    'histogram_128': '128 bins',
    'histogram_256': '256 bins',
    'histogram_512': '512 bins',
    'histogram_1024': '1024 bins',
    'histogram_2048': '2048 bins',
    'histogram_4096': '4096 bins'
  };

  return (
    
    <Container>
      <Row>
        {/* Trigger Settings */}
        <Col md={6} className="mt-3"> 
          <TitleCard title={<strong>Trigger Settings</strong>}>
            <Row>
              <Col>
                <FloatingLabel
                  label="Bin Mode">
                  <EndpointSelect
                    endpoint={acquisitionEndpoint}
                    fullpath="config/bin_mode"
                    style={floatingInputStyle}
                    disabled={isAcquiring}>
                      {(binmode_metadata?.allowed_values ?? ['?']).map(
                        (selection, index) => (
                          <option value={selection} key={index}>{binModeOptions[selection] || selection}</option>
                        )
                      )}
                  </EndpointSelect>
                </FloatingLabel>
              </Col>
            </Row>
            <Row className="mt-3">
              <ButtonGroup>
                {triggerModeRadios.map((radio, idx) => (
                  <OverlayTrigger key={`triggerRadios-${idx}`} placement="top" overlay={radio.value === 'hardware' ? tooltips.acquisition.hardware : tooltips.acquisition.software}>
                    <EndpointButton
                      endpoint={acquisitionEndpoint}
                      fullpath="config/trigger/device"
                      value={radio.value}
                      post_method={updateTriggerModeValue}
                      post_args={{ selectedValue: radio.value }}
                      className='equal-width-buttongroup'
                      id={`radio-${idx}`}
                      type="button"
                      variant='outline-primary'
                      active={triggerModeValue === radio.value}
                      aria-pressed={triggerModeValue === radio.value}
                    >
                      {radio.name}
                    </EndpointButton>
                  </OverlayTrigger>
                ))}
              </ButtonGroup>
            </Row>
            <Row>
              <ButtonGroup className="mt-3">
                {adTriggerModeRadios.map((radio, idx) => (
                  <OverlayTrigger key={`adTriggerRadios-${idx}`} placement="top" overlay={radio.tooltip}>
                    <EndpointButton
                      endpoint={acquisitionEndpoint}
                      fullpath="config/trigger/trigger_mode"
                      value={radio.value}
                      post_method={updateAdTriggerModeValue}
                      post_args={{ selectedValue: radio.value }}
                      className='equal-width-buttongroup'
                      id={`ad-trigger-radio-${idx}`}
                      type="button"
                      variant='outline-secondary'
                      active={adTriggerModeValue === radio.value}
                      aria-pressed={adTriggerModeValue === radio.value}
                      disabled={triggerModeValue==='software'}
                    >
                      {radio.name}
                    </EndpointButton>
                  </OverlayTrigger>
                ))}
              </ButtonGroup>
            </Row>
            <Row className="mt-3">
              <Col>
                <Row>
                  <Col>
                    <EndpointCheckbox
                      type="switch"
                      endpoint={acquisitionEndpoint}
                      fullpath={"state/acquisition/freerun"}
                      label={(
                        <OverlayTrigger placement="top" overlay={tooltips.acquisition.endless_acquisition}>
                          <span>Endless Acquisition</span>
                        </OverlayTrigger>
                      )}
                    />
                  </Col>
                  <Col>
                    <EndpointCheckbox
                      type="switch"
                      endpoint={acquisitionEndpoint}
                      fullpath={"config/trigger/multiple_files/enable"}
                      label={(
                        <OverlayTrigger placement="top" overlay={tooltips.acquisition.multiple_file_acquisition}>
                          <span>Multiple-file Acquisition</span>
                        </OverlayTrigger>
                      )}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <FloatingLabel label={multiple_file_mode ? "Timeframes per file" : "Timeframes to write"}>
                      <EndpointInput
                        endpoint={acquisitionEndpoint} fullpath="config/trigger/number_of_timeframes"
                        disabled={(triggerModeValue==='hardware' && adTriggerModeValue==='continuous mode') || (!multiple_file_mode && acquisitionEndpoint?.data?.state?.acquisition?.freerun)}
                      />
                    </FloatingLabel>
                  </Col>
                  <Col>
                    <FloatingLabel label="Number of files">
                      <EndpointInput
                        endpoint={acquisitionEndpoint}
                        fullpath="config/trigger/multiple_files/number_of_files"
                        disabled={!(multiple_file_mode) || acquisitionEndpoint?.data?.state?.acquisition?.freerun}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col xs={6}>
                    <OverlayTrigger
                      placement="top" overlay={tooltips.acquisition.low_frames_per_timeframe}
                      trigger={framesPerTimeframeTooLow ? undefined : []}
                    >
                      <FloatingLabel label="Frames per timeframe" className={framesPerTimeframeTooLow ? 'border border-2 border-warning' : undefined}>
                        <EndpointInput
                          endpoint={acquisitionEndpoint} fullpath="config/trigger/frames_pre_multiplier"
                          type="number"
                          disabled={triggerModeValue==='hardware' && adTriggerModeValue==='continuous mode'}
                        />
                      </FloatingLabel>
                    </OverlayTrigger>
                  </Col>
                  <Col>
                    <FloatingLabel
                      label="Frame multiplier">
                      <EndpointSelect
                        endpoint={acquisitionEndpoint}
                        fullpath="config/trigger/frame_multiplier"
                        style={floatingInputStyle}
                        disabled={isAcquiring || (triggerModeValue==='hardware' && adTriggerModeValue==='continuous mode')}>
                          {(frameMultiplier_metadata?.allowed_values ?? ['?']).map(
                            (selection, index) => (
                              <option value={selection} key={index}>{formatMultiplierLabel(selection)}</option>
                            )
                          )}
                      </EndpointSelect>
                     </FloatingLabel>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <FloatingLabel label="Timeframes per trigger" className="mt-2">
                      <EndpointInput
                        endpoint={acquisitionEndpoint} fullpath="config/trigger/timeframes_per_trigger"
                        type="number"
                        disabled={triggerModeValue==='software' || !(adTriggerModeValue==='burst mode')}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <FloatingLabel label="Trigger edge polarity" className="mt-2">
                      <EndpointSelect
                        endpoint={readoutEndpoint}
                        fullpath="trigger/polarity"
                        style={floatingInputStyle}
                        disabled={isAcquiring || triggerModeValue==='software'}>
                          {(triggerPolarityOptions?.allowed_values ?? ['?']).map(
                            (selection, index) => (
                              <option value={selection} key={index}>{selection}</option>
                            )
                          )}
                      </EndpointSelect>
                    </FloatingLabel>
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row className="mt-3">
              <label><strong>Summary</strong></label>
            </Row>
            <Row className="mt-3">
              <Col sm={6}>
                <Row>
                  <Col>
                    <FloatingLabel label="Histograms per Acquisition">
                      <Form.Control
                        type="text"
                        value={formatDisplayNumber(hists_per_acquisition)}
                        readOnly
                        style={floatingLabelStyle}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    {/* If in software, this is a predictable outcome. 
                    In hardware mode, it's basically a minimum as triggers may have gaps inbetween */}
                    <OverlayTrigger
                      placement="top"
                      overlay={tooltips.acquisition.est_duration}
                      trigger={isFreerun ? [] : undefined}
                    >
                      <FloatingLabel label={isFreerun ? 'Duration' : 'Est. Duration (s)'}>
                        <Form.Control
                          type="text"
                          value={
                            isFreerun
                              ? 'Until stopped'
                              : triggerModeValue === 'software'
                                ? est_duration.toString()
                                : est_duration.toString() + ' minimum'
                          }
                          readOnly
                          style={floatingLabelStyle}
                        />
                      </FloatingLabel>
                    </OverlayTrigger>
                  </Col>
                </Row>
              </Col>
              <Col sm={6}>
                <Row>
                  <Col>
                    <FloatingLabel label="Frames per histogram">
                      <Form.Control
                        type="text"
                        value={
                          triggerModeValue === 'hardware' && adTriggerModeValue === 'continuous'
                            ? '-'
                            : formatDisplayNumber(acquisitionData?.config?.trigger?.frames_per_timeframe)
                        }
                        readOnly
                        style={floatingLabelStyle}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <FloatingLabel label={isFreerun ? 'Data Rate' : 'Total Storage'}>
                      <Form.Control
                        type="text"
                        value={isFreerun
                          ? checkNull(estimatedDataRate) + ' GB/s'
                          : checkNull(estimatedDataRate * est_duration) + ' GB'}
                        readOnly
                        style={floatingLabelStyle}
                        className={rateTooHigh ? 'border border-danger text-danger bg-danger bg-opacity-10' : ''}
                      />
                    </FloatingLabel>
                  </Col>
                </Row>
              </Col>
            </Row>
          </TitleCard>
        </Col>

        {/* Acquisition Management */}
        <Col md={6}>
          <Card className="mt-3">
            <Card.Header><strong>Acquisition</strong></Card.Header>
            <Card.Body>
              {/* File Name */}
              <Row>
                <Col>
                  <FloatingLabel 
                    label="File Name (without .h5 extension)">
                      <EndpointInput
                        endpoint={acquisitionEndpoint} fullpath="state/acquisition/file_name"
                      />
                  </FloatingLabel>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col>
                  <EndpointCheckbox
                    endpoint={acquisitionEndpoint} fullpath="state/acquisition/add_timestamp"
                    label="Add timestamp to file name"
                  />
                </Col>
              </Row>

              {/* (File Path) */}
              <Row className="mt-3">
                <Col>
                  <FloatingLabel 
                    label="File Path">
                      <EndpointInput
                        endpoint={acquisitionEndpoint} fullpath="state/acquisition/file_path"
                      />
                  </FloatingLabel>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col>
                  <Form.Label>Acquisition Progress</Form.Label>
                  <ProgressBar
                    now={isFreerun ? 100 : acquisitionProgress ?? 0}
                    label={isFreerun ? `${formatDisplayNumber(framesWritten)} frames written` : acquisitionProgressLabel}
                    variant={!isFreerun && acquisitionProgress === 100 ? 'success' : undefined}
                    striped={isFreerun && isAcquiring}
                    animated={isFreerun && isAcquiring}
                    style={{ height: '1.75rem', fontSize: '1rem' }}
                  />
                </Col>
              </Row>
              <Row className="mt-3">
                <Col>
                  <EndpointButton
                    endpoint={acquisitionEndpoint}
                    fullpath="state/acquisition/toggle"
                    variant={acquisitionButtonVariant}
                    value={acquisitionData?.state?.acquisition?.toggle ? false : true}
                    className="w-100"
                    disabled={acquisitionButtonDisabled}
                  >
                    {acquisitionData?.state?.acquisition?.toggle ? 'Stop acquisition' : 'Start acquisition'}
                  </EndpointButton>
                  {rateTooHigh && (
                    <div className="text-danger mt-2">
                      Estimated data rate ({acquisitionData?.config?.estimated_data_rate} GB/s) exceeds network capacity (12.5 GB/s). Increase frames per timeframe or reduce the bin count (bin mode).
                    </div>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Acquisition;
import type { useAdapterEndpoint } from '@dssg/odin-react';
import { Col, FloatingLabel, Form, OverlayTrigger, Row } from 'react-bootstrap';
import type { AcquisitionTypes } from '../../EndpointTypes.js';
import { tooltips } from '../../tooltips.js';
import { checkNull, floatingLabelStyle } from '../../utils.js';

type AcquisitionEndpoint = ReturnType<typeof useAdapterEndpoint<AcquisitionTypes>>;

interface AcquisitionSummaryProps {
  acquisitionEndpoint: AcquisitionEndpoint;
}

function formatDisplayNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toLocaleString() : String(value);
}

function AcquisitionSummary({ acquisitionEndpoint }: AcquisitionSummaryProps) {
  const acquisitionData = acquisitionEndpoint.data;
  const trigger = acquisitionData?.config?.trigger;
  const isFreerun = acquisitionData?.state?.acquisition?.freerun ?? false;

  const triggerMode = trigger?.device ?? 'software';
  const adTriggerMode = trigger?.trigger_mode ?? 'burst mode';

  const estimatedDataRate = acquisitionData?.config?.estimated_data_rate ?? 0;
  const rateTooHigh = estimatedDataRate > 12.5;
  const numberOfTimeframes = trigger?.number_of_timeframes ?? 0;
  const multipleFiles = trigger?.multiple_files;
  const numberOfFiles = multipleFiles?.enable ? (multipleFiles.number_of_files ?? 1) : 1;
  const framesPerTimeframe = trigger?.frames_per_timeframe ?? 0;
  const timeframesPerTrigger = trigger?.timeframes_per_trigger ?? 0;

  // Determine what to display
  const isHardware = triggerMode === 'hardware';
  const isHardwareContinuous = isHardware && adTriggerMode === 'continuous mode';
  const isHardwareBurstOrStep = isHardware && (adTriggerMode === 'burst mode' || adTriggerMode === 'step scan');
  const showDurationPerTrigger = isFreerun && isHardwareBurstOrStep;
  const isSoftwareFreerun = isFreerun && !isHardware;
  const isOpenEnded = isFreerun || isHardwareContinuous;

  const histogramsPerAcquisition = numberOfTimeframes * numberOfFiles;
  const estimatedAcquisitionDuration = (histogramsPerAcquisition * framesPerTimeframe) / 1_000_000;
  const estimatedDurationPerTrigger = (framesPerTimeframe * (adTriggerMode === 'burst mode' ? timeframesPerTrigger : 1)) / 1_000_000;
  const histogramsValue = isOpenEnded
    ? isSoftwareFreerun && framesPerTimeframe > 0
      ? formatDisplayNumber(1_000_000 / framesPerTimeframe)
      : '-'
    : formatDisplayNumber(histogramsPerAcquisition);
  const framesPerHistogramValue = isHardwareContinuous
    ? '-'
    : formatDisplayNumber(framesPerTimeframe);
  const durationValue = showDurationPerTrigger
    ? estimatedDurationPerTrigger.toString()
    : isOpenEnded
      ? 'Until stopped'
      : `${estimatedAcquisitionDuration}${isHardware ? ' minimum' : ''}`;
  const durationLabel = showDurationPerTrigger
    ? 'Est. Duration per trigger (s)'
    : isOpenEnded
      ? 'Duration'
      : 'Est. Duration (s)';
  const dataRateValue = isOpenEnded
    ? `${checkNull(estimatedDataRate)} GB/s`
    : `${checkNull(estimatedDataRate * estimatedAcquisitionDuration)} GB`;

  return (
    <>
      <Row className="mt-3">
        <label><strong>Summary</strong></label>
      </Row>
      <Row className="mt-3">
        <Col sm={6}>
          <Row>
            <Col>
              <FloatingLabel label={isSoftwareFreerun ? 'Histograms per second' : 'Histograms per Acquisition'}>
                <Form.Control
                  type="text"
                  value={histogramsValue}
                  readOnly
                  style={floatingLabelStyle}
                />
              </FloatingLabel>
            </Col>
          </Row>
          <Row>
            <Col>
              <OverlayTrigger
                placement="top"
                overlay={tooltips.acquisition.est_duration}
                trigger={isOpenEnded ? [] : undefined}
              >
                <FloatingLabel label={durationLabel}>
                  <Form.Control
                    type="text"
                    value={durationValue}
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
                  value={framesPerHistogramValue}
                  readOnly
                  style={floatingLabelStyle}
                />
              </FloatingLabel>
            </Col>
          </Row>
          <Row>
            <Col>
              <FloatingLabel label={isOpenEnded ? 'Data Rate' : 'Est. Total Storage'}>
                <Form.Control
                  type="text"
                  value={dataRateValue}
                  readOnly
                  style={floatingLabelStyle}
                  className={rateTooHigh ? 'border border-danger text-danger bg-danger bg-opacity-10' : ''}
                />
              </FloatingLabel>
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
}

export default AcquisitionSummary;
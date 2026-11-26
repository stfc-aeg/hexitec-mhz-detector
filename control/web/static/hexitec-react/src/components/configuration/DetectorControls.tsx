import { useState } from 'react';
import { Row, Col, Card, FloatingLabel, Form, Button, Alert } from 'react-bootstrap';
import { UserAware } from '../UserAware';
import { EndpointButton, EndpointSelect, type AdapterEndpoint } from '@dssg/odin-react';;
import type { AcquisitionTypes, ProxyParams } from '../../EndpointTypes';

interface DetectorControlsProps {
  proxyEndpoint: AdapterEndpoint<ProxyParams>;
  acquisitionEndpoint: AdapterEndpoint<AcquisitionTypes>;
  isCustom: boolean;
}

export default function DetectorControls({ proxyEndpoint, acquisitionEndpoint, isCustom }: DetectorControlsProps) {

  const [pendingAction, setPendingAction] = useState<'readout' | 'loki' | null>(null);
  const lokiData = proxyEndpoint.data?.loki?.application?.asic_settings;
  const acquisitionState = acquisitionEndpoint.data?.state;
  const hardwareBusy = acquisitionState?.acquisition?.toggle || acquisitionState?.preview?.toggle;
  const lokiRebootInProgress = acquisitionState?.reboot?.loki_reboot_in_progress ?? false;
  const lokiRebootError = acquisitionState?.reboot?.loki_reboot_error;

  // low: something, high: something
  const negativeRangeOptions = lokiData?.negative_range_options;

  return (
    <Card className="mt-3">
      <Card.Header><strong>Detector Controls</strong></Card.Header>
      <Card.Body>
        <Row className="mb-3">
          {/* This is an endpoint dropdown for feedback gain in loki
          so the options are 7, 14, and 21 with unit femtofarads fF*/}
          <Col>
            <FloatingLabel label="Feedback Gain Stage">
              <EndpointSelect
                endpoint={proxyEndpoint}
                fullpath="loki/application/asic_settings/feedback_capacitance"
                disabled={!isCustom}
              >
                <option value="7">7fF (High)</option>
                <option value="14">14fF (Medium)</option>
                <option value="21">21fF (Low)</option>
              </EndpointSelect>
            </FloatingLabel>
          </Col>
        </Row>

        <UserAware userLevel="power" as={Row} className="mb-3">
          <Col>
            <FloatingLabel label="Negative Dynamic Range">
              <EndpointSelect
                endpoint={proxyEndpoint}
                fullpath="loki/application/asic_settings/negative_range_lowhigh"
                disabled={!isCustom}
              >
                <option value={"low"}>{negativeRangeOptions?.low} (Low)</option>
                <option value={"high"}>{negativeRangeOptions?.high} (High)</option>
              </EndpointSelect>
            </FloatingLabel>
          </Col>
        </UserAware>

        <UserAware userLevel="power">
          <Row className="mt-3 g-2">
            <Col>
              <Button
                variant="danger"
                className="w-100"
                disabled={hardwareBusy || lokiRebootInProgress}
                onClick={() => setPendingAction('readout')}
              >
                Reset Data Stream 
              </Button>
            </Col>
            <Col>
              <Button
                variant="danger"
                className="w-100"
                disabled={hardwareBusy || lokiRebootInProgress}
                onClick={() => setPendingAction('loki')}
              >
                {lokiRebootInProgress ? 'Reinitializing LOKI ASIC...' : 'Reinitialize Detector ASIC'}
              </Button>
            </Col>
          </Row>
          {pendingAction && (
            <Alert variant="warning" className="mt-3 mb-0" role="alert">
              <div>
                {pendingAction === 'readout'
                  ? 'This resets the readout data path. The monitor will start an automatic recovery process.'
                  : 'This reruns LOKI ASIC initialisation, halting data. This will trigger the monitor.'}
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <Button variant="secondary" onClick={() => setPendingAction(null)}>
                  Cancel
                </Button>
                <EndpointButton
                  endpoint={acquisitionEndpoint}
                  fullpath={pendingAction === 'readout' ? 'state/readout_reboot' : 'state/reboot/loki_reboot'}
                  value={true}
                  variant="danger"
                  disabled={hardwareBusy || lokiRebootInProgress}
                  post_method={() => setPendingAction(null)}
                >
                  Confirm {pendingAction === 'readout' ? 'reset' : 'ASIC reinitialization'}
                </EndpointButton>
              </div>
            </Alert>
          )}
          {lokiRebootError && (
            <Form.Text className="text-danger" role="alert">
              {lokiRebootError}
            </Form.Text>
          )}
        </UserAware>
      </Card.Body>
    </Card>
  );
}

import { Alert, Badge, Card, Table } from 'react-bootstrap';
import { WithEndpoint } from 'odin-react';

const ResetRetriesButton = WithEndpoint('button');

interface DiagnosticInfoProps {
  endpoint: any;
}

export function DiagnosticInfo({ endpoint }: DiagnosticInfoProps) {
  const adxdmaData = endpoint.data?.mhz_monitor || {};
  const { 
    current_state = "Unknown", 
    chan_up, 
    lane_up, 
    bonded,
    current_retry = 0, 
    max_retries = 3,
    reset_events = [],
    total_resets = 0
  } = adxdmaData;

  const getNextAction = () => {
    switch(current_state) {
      case 'Idle': return 'Waiting to start monitoring';
      case 'Initialising': return 'Testing ADXDMA connection';
      case 'Monitoring': return 'Monitoring data flow and lanes/channels';
      case 'Resetting': return 'Executing reset sequence';
      case 'WaitingForLanes': return 'Waiting for aurora lanes to come up';
      case 'Rebonding': return 'Sending ASIC_REBOND command';
      case 'WaitingForChannels': return 'Waiting for channels to bond';
      case 'Reactivating': return 'Reactivating data acquisition';
      case 'Error': return 'System in error state';
      case 'Not Available': return 'State machine not available';
      default: return 'Processing';
    }
  };

  // Format hex values for display
  const formatHexValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return `0x${value.toString(16).toUpperCase()}`;
    return 'N/A';
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  // Get last 5 reset events
  const recentResets = reset_events.slice(-5).reverse(); // Most recent first

  const hasHardwareStatus = chan_up !== undefined && lane_up !== undefined;
  const showResetButton = current_retry >= max_retries;

  return (
    <Card className="mb-3">
      <Card.Header><strong>Diagnostic Information</strong></Card.Header>
      <Card.Body>
        <Card.Text className="mb-3">
          <strong>Technical State:</strong> <code>{current_state}</code>
        </Card.Text>
        
        <Card.Text className="mb-3">
          <strong>Current Action:</strong> {getNextAction()}
        </Card.Text>
        
        {hasHardwareStatus ? (
          <Table striped bordered size="sm" className="mb-3">
            <thead>
              <tr><th>Parameter</th><th>Value</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Channel Up</td>
                <td><code>{formatHexValue(chan_up)}</code></td>
                <td>
                  <Badge bg={(chan_up === 1048575 || chan_up === 0xFFFFF) ? 'success' : 'danger'}>
                    {(chan_up === 1048575 || chan_up === 0xFFFFF) ? 'UP' : 'DOWN'}
                  </Badge>
                </td>
              </tr>
              <tr>
                <td>Lane Up</td>
                <td><code>{formatHexValue(lane_up)}</code></td>
                <td>
                  <Badge bg={(lane_up === 1048575 || lane_up === 0xFFFFF) ? 'success' : 'danger'}>
                    {(lane_up === 1048575 || lane_up === 0xFFFFF) ? 'UP' : 'DOWN'}
                  </Badge>
                </td>
              </tr>
              {bonded !== undefined && (
                <tr>
                  <td>Bonded</td>
                  <td>{bonded ? 'Yes' : 'No'}</td>
                  <td>
                    <Badge bg={bonded ? 'success' : 'danger'}>
                      {bonded ? 'BONDED' : 'NOT BONDED'}
                    </Badge>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        ) : (
          <Alert variant="info" className="mb-3">
            <strong>Hardware Status:</strong> Data not available - state machine may be initializing
          </Alert>
        )}
        
        <Card.Text className="mb-3">
          <small className="text-muted">
            Retry Count: {current_retry} / {max_retries}
            {current_retry >= max_retries && (
              <Badge bg="danger" className="ms-2">Max retries reached</Badge>
            )}
          </small>
        </Card.Text>

        {/* Reset Events Log */}
        <Card className="mb-3">
          <Card.Header className="py-2">
            <small><strong>Reset History</strong></small>
          </Card.Header>
          <Card.Body className="py-2">
            <div className="mb-2">
              <Badge bg="info" className="me-2">Total Resets: {total_resets}</Badge>
              <Badge bg="secondary">Recent: {recentResets.length}</Badge>
            </div>
            
            {recentResets.length > 0 ? (
              <div style={{ fontSize: '0.75rem', maxHeight: '150px', overflowY: 'auto' }}>
                <Table size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th style={{ fontSize: '0.7rem' }}>#</th>
                      <th style={{ fontSize: '0.7rem' }}>Time</th>
                      <th style={{ fontSize: '0.7rem' }}>Reason</th>
                      <th style={{ fontSize: '0.7rem' }}>Retry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentResets.map((event: any, index: number) => (
                      <tr key={index}>
                        <td style={{ fontSize: '0.7rem' }}>{event.count}</td>
                        <td style={{ fontSize: '0.7rem' }}>{formatTimestamp(event.timestamp)}</td>
                        <td style={{ fontSize: '0.7rem' }}>{event.reason}</td>
                        <td style={{ fontSize: '0.7rem' }}>{event.retry_attempt}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <small className="text-muted">No reset events recorded</small>
            )}
          </Card.Body>
        </Card>
        
        {/* Reset Retries Button */}
        {showResetButton && (
          <Alert variant="warning">
            <strong>Recovery Action Required</strong>
            <Card.Text className="mt-2">
              <ResetRetriesButton
                variant="warning"
                size="sm"
                endpoint={endpoint}
                fullpath="/mhz_monitor/reset_retries"
                value={true}
                event_type="click"
              >
                Reset Retry Counter
              </ResetRetriesButton>
            </Card.Text>
          </Alert>
        )}
        
        {/* Success message when monitoring */}
        {current_state === 'Monitoring' && (
          <Alert variant="success">
            System is monitoring successfully
          </Alert>
        )}

        {/* System idle message */}
        {current_state === 'Idle' && (
          <Alert variant="info">
            System is idle - monitoring will start automatically
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
}
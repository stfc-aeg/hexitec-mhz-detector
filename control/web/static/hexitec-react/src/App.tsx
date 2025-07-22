import 'bootstrap/dist/css/bootstrap.min.css';
import { Badge, Card, ListGroup, Row, Col, Table, Button } from 'react-bootstrap';
import { OdinApp, TitleCard, useAdapterEndpoint, WithEndpoint } from 'odin-react'

const ResetRetriesButton = WithEndpoint(Button);

function App() {
  const url = import.meta.env.VITE_ENDPOINT_URL;
  const endpoint = useAdapterEndpoint('hexitec', url, 500)
  const data = endpoint.data

  const adxdmaData = data?.adxdma_monitor || {};
  const currentState = adxdmaData.current_state || "Unknown";
  const bonded = adxdmaData.bonded || false;
  const chanUp = adxdmaData.chan_up;
  const laneUp = adxdmaData.lane_up;
  const currentRetry = adxdmaData.current_retry || 0;
  const maxRetries = adxdmaData.max_retries || 2;
  
  // User-friendly state maping 
  const getUserFriendlyState = () => {
    if (currentState === 'Error') return 'Error';
    if (currentState === 'Initialising') return 'Initialising';
    if (currentState === 'Monitoring' && bonded) return 'Monitoring + Bonded';
    if (currentState === 'Monitoring' && !bonded) return 'Monitoring';
    if (['Rebinding', 'WaitingForBind', 'Resetting', 'WaitingForValues'].includes(currentState)) return 'Rebonding';
    return 'Unknown';
  };

  // State colors
  const getStateColor = (state) => {
    switch(state) {
      case 'Monitoring + Bonded': return 'success';
      case 'Error': return 'danger';
      case 'Initialising': return 'warning';
      case 'Monitoring': return 'info';
      case 'Rebonding': return 'primary';
      default: return 'secondary';
    }
  };

  // Get next expected action
  const getNextAction = () => {
    switch(currentState) {
      case 'Initialising': return 'Testing connection...';
      case 'Monitoring': return bonded ? 'Monitoring data flow' : 'Detecting bond loss';
      case 'Resetting': return 'Clearing data path...';
      case 'WaitingForValues': return 'Waiting for data activity...';
      case 'Rebinding': return 'Sending rebond command...';
      case 'WaitingForBind': return 'Waiting for bond completion...';
      case 'Error': return 'Attempting recovery...';
      default: return 'Processing...';
    }
  };

  // Format hex values for display
  const formatHexValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return typeof value === 'string' ? value : `0x${value.toString(16)}`;
  };

  const userFriendlyState = getUserFriendlyState();
  const showResetButton = currentRetry >= maxRetries;

  console.log(url)
  console.log(data)

  return (
    <OdinApp title={'Hexitec-MHZ'} navLinks={['AD Setup']}>
      <TitleCard title='AD Bonding Status'>
        <Row>
          <Col md={6}>
            <Card className="mb-3">
              <Card.Header>Status Overview</Card.Header>
              <Card.Body>
                {/* User-friendly state */}
                <div className="text-center mb-3">
                  <Badge 
                    bg={getStateColor(userFriendlyState)} 
                    className="fs-4 p-3"
                  >
                    {userFriendlyState}
                  </Badge>
                </div>
                
                {/* All states with current highlighted */}
                <ListGroup variant="flush" size="sm">
                  {['Initialising', 'Monitoring', 'Monitoring + Bonded', 'Rebonding', 'Error'].map((state) => (
                    <ListGroup.Item 
                      key={state}
                      className={state === userFriendlyState ? 'active' : ''}
                      style={{ padding: '0.5rem' }}
                    >
                      {state}
                      {state === userFriendlyState && (
                        <Badge bg="light" text="dark" className="ms-2 float-end">
                          Current
                        </Badge>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card className="mb-3">
              <Card.Header>Current Action</Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <strong>Technical State:</strong> {currentState}
                </div>
                
                <div className="mb-3">
                  <strong>Action:</strong> {getNextAction()}
                </div>
                
                {/* Channel/Lane Status Table */}
                <Table striped bordered size="sm" className="mb-3">
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th>Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Channel Up</td>
                      <td><code>{formatHexValue(chanUp)}</code></td>
                      <td>
                        <Badge bg={chanUp === '0xfffff' ? 'success' : 'secondary'}>
                          {chanUp === '0xfffff' ? 'UP' : 'DOWN'}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td>Lane Up</td>
                      <td><code>{formatHexValue(laneUp)}</code></td>
                      <td>
                        <Badge bg={laneUp === '0xfffff' ? 'success' : 'secondary'}>
                          {laneUp === '0xfffff' ? 'UP' : 'DOWN'}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td>Bonded</td>
                      <td>{bonded ? 'Yes' : 'No'}</td>
                      <td>
                        <Badge bg={bonded ? 'success' : 'danger'}>
                          {bonded ? 'BONDED' : 'NOT BONDED'}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </Table>
                
                {/* Retry Information */}
                <div className="mb-2">
                  <small className="text-muted">
                    Retry Count: {currentRetry} / {maxRetries}
                  </small>
                </div>
                
                {/* Reset Retries Button */}
                {showResetButton && (
                  <div className="alert alert-warning" role="alert">
                    <strong>Max retries reached!</strong>
                    <div className="mt-2">
                      <ResetRetriesButton
                        variant="warning"
                        size="sm"
                        endpoint={endpoint}
                        fullpath="/adxdma_monitor/reset_retries"
                        value={true}
                        event_type="click"
                      >
                        Reset Retry Counter
                      </ResetRetriesButton>
                    </div>
                  </div>
                )}
                
                {userFriendlyState === 'Monitoring + Bonded' && (
                  <div className="alert alert-success" role="alert">
                    ADXDMA Bonded to packets
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </TitleCard>
    </OdinApp>
  )
}

export default App
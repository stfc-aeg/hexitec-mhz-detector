import { Badge, Card, ListGroup } from 'react-bootstrap';

interface StatusOverviewProps {
  endpoint: any;
}

export function StatusOverview({ endpoint }: StatusOverviewProps) {
  const adxdmaData = endpoint.data?.mhz_monitor || {};
  const { current_state = "Unknown" } = adxdmaData;

  const getUserFriendlyState = () => {
    switch(current_state) {
      case 'Idle': return 'System Idle';
      case 'Initialising': return 'Initialising';
      case 'Monitoring': return 'Monitoring';
      case 'Resetting': return 'Resetting';
      case 'WaitingForLanes': return 'Waiting for Lanes';
      case 'Rebonding': return 'Rebonding';
      case 'WaitingForChannels': return 'Waiting for Channels';
      case 'Reactivating': return 'Reactivating';
      case 'Error': return 'Error';
      case 'Not Available': return 'Not Available';
      default: return 'Unknown';
    }
  };

  const getStateColor = (state: string) => {
    switch(state) {
      case 'Monitoring': return 'success';
      case 'Error': return 'danger';
      case 'System Idle': return 'secondary';
      case 'Initialising': return 'warning';
      case 'Resetting':
      case 'Waiting for Lanes':
      case 'Rebonding':
      case 'Waiting for Channels':
      case 'Reactivating': return 'primary';
      case 'Not Available': return 'dark';
      default: return 'secondary';
    }
  };

  const userFriendlyState = getUserFriendlyState();

  const allStates = [
    'System Idle',
    'Initialising', 
    'Monitoring',
    'Resetting',
    'Waiting for Lanes',
    'Rebonding', 
    'Waiting for Channels',
    'Reactivating',
    'Error'
  ];

  return (
    <Card className="mb-3">
      <Card.Header><strong>Status Overview</strong></Card.Header>
      <Card.Body>
        <Card.Text className="text-center mb-3">
          <Badge bg={getStateColor(userFriendlyState)} className="fs-4 p-3">
            {userFriendlyState}
          </Badge>
        </Card.Text>
        
        <ListGroup variant="flush">
          {allStates.map((state) => (
            <ListGroup.Item 
              key={state}
              className={state === userFriendlyState ? 'active' : ''}
              style={{ padding: '0.5rem' }}
            >
              {state}
              {state === userFriendlyState && (
                <Badge bg="light" text="dark" className="ms-2 float-end">Current</Badge>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
}
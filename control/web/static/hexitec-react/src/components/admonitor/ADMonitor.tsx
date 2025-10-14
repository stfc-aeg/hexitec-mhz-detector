import { Alert, Container, Row, Col } from 'react-bootstrap';
import { StatusOverview } from './StatusOverview';
import { DiagnosticInfo } from './DiagInfo';

interface ADMonitorProps {
  endpoint: any;
  show: boolean;
}

export function ADMonitor({ endpoint, show }: ADMonitorProps) {
  if (!show) return null;

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.6)', 
        backdropFilter: 'blur(3px)',
        zIndex: 9999
      }}
    >
      <Container>
        <Alert variant="danger" className="shadow-lg p-4">
          <Alert.Heading className="d-flex align-items-center">
            <span className="me-2">⚠️</span>
            Hardware Issue Detected
          </Alert.Heading>
          
          <Alert variant="danger" className="mb-4">
            An issue with the Alpha-Data Hardware has been detected. Below is information on the system's automatic attempts
            to resolve this issue. If maximum retries are attempted, contact technical support.
          </Alert>

          <Row>
            <Col md={6}>
              <StatusOverview endpoint={endpoint} />
            </Col>
            
            <Col md={6}>
              <DiagnosticInfo endpoint={endpoint} />
            </Col>
          </Row>

          <hr />
          <p className="mb-0">
            <small className="text-muted">
              This alert will automatically dismiss when the hardware connection is restored.
            </small>
          </p>
        </Alert>
      </Container>
    </div>
  );
}
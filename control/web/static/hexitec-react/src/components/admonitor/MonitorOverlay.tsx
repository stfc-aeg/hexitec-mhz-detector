import { EndpointButton, OdinTable, OdinTableRow, TitleCard, useAdapterEndpoint, type AdapterEndpoint, type ParamTree } from "odin-react";
import { Alert, Col, Modal, Row, Container, Badge, ListGroup } from "react-bootstrap";
import { StatusOverview } from "./StatusOverview";
import { DiagnosticInfo } from "./DiagInfo";

import style from "./style.module.css"
import type { ComponentProps } from "react";

interface ResetHistory extends ParamTree{
  count: number;
  reason: string;
  retry_attempt: number;
  timestamp: string;  // ISO datetime format
}

const ErrorState = ["Resetting", "WaitingForLanes", "WaitingForChannels",
                    "Reactivating", "Error"] as const;
                

type MonitorState = "Idle" | "Initialising" | "Monitoring" 
                  | typeof ErrorState[number];
type CriticalState = typeof ErrorState[number];

const isCriticalState = (x: MonitorState): x is CriticalState => {
    return ErrorState.some((state) => x === state)
}

interface MonitorTree extends ParamTree{
  clear_history: null;  // Trigger param, clears the reset history
  current_retry: number;
  monitoring: boolean;
  num_resets: number;
  recover: boolean;
  reset_history: ResetHistory[];
  state: MonitorState;
}
interface HexitecParamTree extends ParamTree {
  user_type: string;
  mhz_monitor: MonitorTree;
}


interface MonitorOverplayProps extends React.PropsWithChildren{
    interval?: number;
}

const SystemMonitorOverlay: React.FC<MonitorOverplayProps> = (
    {interval = 1000}
) => {

    const endpoint = useAdapterEndpoint<HexitecParamTree>("hexitec", import.meta.env.VITE_ENDPOINT_URL, interval);
    
    const {state = "Idle",
           recover = false,
           current_retry = 0,
           reset_history = [],
           num_resets = 0} = endpoint.data.mhz_monitor ?? {};
    const max_retries: number = endpoint.metadata?.mhz_monitor?.current_retry?.max ?? 3;

    const allStates = endpoint.metadata?.mhz_monitor?.state?.allowed_values as typeof state[] ?? [];

    const recentResets = reset_history?.slice(-5).reverse() ?? [];

    const resetTableData = recentResets.map(log => {
        return {
            "timestamp": new Date(log.timestamp).toLocaleString(),
            "retry_attempt": log.retry_attempt + 1,
            "count": log.count,
            "reason": log.reason
        }
    })
    const getUserFriendlyState = (getState: typeof state): [string, ComponentProps<typeof Alert>["variant"]] => {
        let text: string, colour: ComponentProps<typeof Alert>["variant"];

        switch(getState) {
            case 'Idle': text = 'System Idle'; break;
            case 'Initialising': text = 'Initialising'; break;
            case 'Monitoring': text = 'Monitoring'; break;
            case 'Resetting': text = 'Resetting'; break;
            case 'WaitingForLanes': text = 'Waiting for Lanes'; break;
            case 'WaitingForChannels': text = 'Waiting for Channels'; break;
            case 'Reactivating': text = 'Reactivating'; break;
            case 'Error':
            default: text = 'Error';
        }
        switch(getState) {
            case "Resetting":
            case "WaitingForLanes":
            case "WaitingForChannels":
            case "Reactivating":
                colour = "warning"
                break;
            case "Error":
                colour = "danger";
                break
            case "Monitoring":
                colour = "success";
                break;
            case "Idle":
            case "Initialising":
            default:
                colour = "secondary";
        }
        return [text, colour]
    }
    const [userFriendlyState, stateColor] = getUserFriendlyState(state);


    // const showOverlay = () => {
    //     const adxdmaData = endpoint.data.mhz_monitor;
    //     if (!adxdmaData) return false;

    //     const {state, recover} = adxdmaData;

    //     // return (isCriticalState(state) || recover)
    //     return true;
    // }
    
    return (
        <Modal show={isCriticalState(state) || recover} backdrop="static"
            centered keyboard={false} dialogClassName={style.stateOverlay}>
            <Modal.Header>
                <Modal.Title>⚠️ Hardware Issue Detected ⚠️</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                <Row>
                <Col>
                    <Alert variant="danger">
                        An issue with the Data Readout Hardware has been detected. Below is information on the
                        system's automatic attempts to resolve this issue. If maximum retries are attempted,
                        contact technical support.
                    </Alert>
                </Col>
                </Row>
                <Row>
                <Col md={5}>
                    <h2>
                        Status: <Badge bg={stateColor}>{userFriendlyState}</Badge>
                    </h2>
                    <p>
                        Retry Count: {current_retry} / {max_retries}
                        {current_retry >= max_retries && (
                            <Badge bg="danger">Max retries reached</Badge>
                        )}
                    </p>
                    <ListGroup>
                        {allStates.map((states) => (
                            <ListGroup.Item key={states} active={state == states}>
                                {getUserFriendlyState(states)[0]}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                    
                </Col>
                <Col>
                    <h1> Reset History</h1>
                    {resetTableData.length > 0 ? (
                    <>
                    <p>{reset_history.length} reset events recorded</p>
                    <OdinTable columns={{"count": "Count", "retry_attempt": "Attempt", "timestamp": "Timestamp", "reason": "Reason"}}>
                        {resetTableData.map((log) => (
                            <OdinTableRow key={log.timestamp} row={log}/>
                        ))}
                    </OdinTable>
                    </>
                    ) : (
                        <p>No Reset events recorded</p>
                    )}
                    <EndpointButton endpoint={endpoint} fullpath="mhz_monitor/clear_history"
                                    value={true} disabled={!(resetTableData.length > 0)}>
                        Clear History
                    </EndpointButton>
                </Col>
                </Row>
                <Row>
                    <Col>
                        
                    </Col>
                </Row>
                </Container>
            </Modal.Body>
            <Modal.Footer>
                <p>This alert will automatically dismiss when the hardware connection is restored.</p>
                <EndpointButton endpoint={endpoint} fullpath="mhz_monitor/recover" value={true}
                                variant="warning" disabled={!recover}>
                    {recover ? "manually Recover from Error" : "Recovery not required"}
                </EndpointButton>
            </Modal.Footer>
        </Modal>
    )

    
}

export {SystemMonitorOverlay, type HexitecParamTree};
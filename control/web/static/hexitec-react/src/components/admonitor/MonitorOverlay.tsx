import { EndpointButton, OdinTable, OdinTableRow, useAdapterEndpoint, type ParamTree } from "odin-react";
import { Alert, Badge, Modal, ProgressBar } from "react-bootstrap";

import type { ComponentProps } from "react";
import style from "./style.module.css";

interface ResetHistory extends ParamTree{
  count: number;
  reason: string;
  retry_attempt: number;
  timestamp: string;  // ISO datetime format
}

type States = 'System Idle' | 'Initialising' | 'Monitoring' | 'Resetting'
            | 'Waiting For Lanes'| 'Waiting For Channels'| 'Reactivating'
            | 'Loki Power Init'| 'Loki COB Init'| 'Loki ASIC Init'
            | 'Error'


const isCriticalState = (x: States): boolean => {
    return (!["System Idle", "Initialising", "Monitoring"].includes(x));
}

interface MonitorTree extends ParamTree{
  clear_history: null;  // Trigger param, clears the reset history
  current_retry: number;
  monitoring: boolean;
  num_resets: number;
  timeout: number;
  recover: boolean;
  reset_history: ResetHistory[];
  state: States;
  error: string;
  next_state: string[];
}

interface HexitecParamTree extends ParamTree {
  user_type: "basic" | "power";
  mhz_monitor: MonitorTree;
}


interface MonitorOverplayProps extends React.PropsWithChildren{
    interval?: number;
}

const SystemMonitorOverlay: React.FC<MonitorOverplayProps> = (
    {interval = 1000}
) => {

    const endpoint = useAdapterEndpoint<HexitecParamTree>("hexitec", import.meta.env.VITE_ENDPOINT_URL, interval);
    
    const {
        state = "System Idle",
        recover = false,
        current_retry = 0,
        reset_history = [],
        num_resets = 0,
        error = "",
        timeout = 0,
    } = endpoint.data.mhz_monitor ?? {};

    const max_retries: number = endpoint.metadata?.mhz_monitor?.current_retry?.max ?? 3;
    const max_timeout: number = endpoint.metadata?.mhz_monitor?.timeout?.max ?? 60;
    const recentResets = reset_history?.slice(-5).reverse() ?? [];
    const resetTableData = recentResets.map(log => {
        return {
            "timestamp": new Date(log.timestamp).toLocaleString(),
            "retry_attempt": log.retry_attempt,
            "count": log.count,
            "reason": log.reason
        }
    })

    const getStateColour = (getState: typeof state): ComponentProps<typeof Alert>["variant"] => {
        let colour: ComponentProps<typeof Alert>["variant"];
        
        // const text = getState.replace(/([a-z])([A-Z])/g, '$1 $2')
        switch(getState) {
            case "System Idle":
            case "Initialising":
                colour = "secondary";
                break;
            case "Error":
                colour = "danger";
                break
            case "Monitoring":
                colour = "success";
                break;
            case "Resetting":
            case "Waiting For Lanes":
            case "Waiting For Channels":
            case "Reactivating":
            default:
                colour = "primary";
        }
        return colour
    }

    const getStateProgressBar = (getState: typeof state): [string, number] => {

        switch(getState) {
            case "System Idle":
            case "Initialising":
            case "Monitoring":
                return ["success", 100]
            case "Error":
                return ["danger", 100]
            case "Resetting":
                return ["primary", 15]
            case "Waiting For Lanes":
            case "Loki Power Init":
                return ["primary", 25]
            case "Waiting For Channels":
            case "Loki COB Init":
                return ["primary", 50]
            case "Reactivating":
            case "Loki ASIC Init":
                return ["primary", 75]
            default:
                return ["secondary", 100]
        }
    }

    const stateColor = getStateColour(state);
    const [progressColor, progressAmount] = getStateProgressBar(state);

    return (
        <Modal show={isCriticalState(state) || current_retry != 0} backdrop="static" size="lg"
            centered keyboard={false} dialogClassName={style.stateOverlay}>
            <Modal.Header>
                <Modal.Title>⚠️ Hardware Issue Detected ⚠️</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                An issue with the Data Readout Hardware has been detected. Below is information on the
                system's automatic attempts to resolve this issue. If maximum retries are attempted,
                contact technical support.
            </Modal.Body>
            
            <Modal.Body>
                <h2>Status: <Badge bg={stateColor}>{state}</Badge></h2>
                <p>
                    {current_retry > max_retries ? (
                        <Badge bg="danger">Max retries reached</Badge>
                    ) :
                    (
                        <Badge bg="secondary">Reset Attempt: {current_retry}/{max_retries}</Badge>
                    )}
                </p>
                <ProgressBar>
                <ProgressBar animated={!['System Idle', 'Initialising', 'Monitoring', "Error"].includes(state)}
                    now={progressAmount} variant={progressColor}
                    label={state}/>
                {timeout > 0 &&
                    <ProgressBar variant="info" animated now={(timeout / max_timeout)*(100-progressAmount)}
                        className={style.progressLabelContainer} label={
                        <div className={style.progressLabelContainer}>
                            <p className={style.progressLabelOver}>
                                {`Timeout: ${timeout}/${max_timeout}`}
                            </p>
                            <div className={style.progressLabelUnder}>
                                {`Timeout: ${timeout}/${max_timeout}`}
                            </div>
                        </div>}
                    />
                }
                </ProgressBar>
                
                {error && (
                    <>
                        <p>Error Message: {error}</p>
                        <EndpointButton endpoint={endpoint} fullpath="mhz_monitor/recover" value={true}
                                    variant="danger" disabled={!recover}>
                        {recover ? "Manually Recover from Error" : "Recovery not Available"}
                        </EndpointButton>
                    </>
                )}
            </Modal.Body>
            <Modal.Body>
                <h2>Reset History</h2>
                {num_resets > 0 ? (
                <>
                <p>{num_resets} reset events recorded</p>
                <OdinTable columns={{"count": "Total Reset", "retry_attempt": "Attempt Number", "timestamp": "Timestamp", "reason": "Reason"}}>
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
            </Modal.Body>
            <Modal.Footer>
                This alert will automatically dismiss when the hardware connection is restored.
            </Modal.Footer>
        </Modal>
    )

    
}

export { SystemMonitorOverlay, type HexitecParamTree };

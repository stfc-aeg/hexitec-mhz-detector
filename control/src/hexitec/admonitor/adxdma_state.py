from statemachine import StateMachine, State
from ..util.iac import iac_get, iac_set
import time
import logging

class AdxdmaMonitor(StateMachine):
    """
        StateMachine to monitor the datapath of the AD card in the HexitecMHz system.
        Detects when the AD card is not bonded to MHz packets, handles resetting 
        registers, looking for data activity and attempting to rebond the AD card. 
    """
    # states
    monitoring = State('Monitoring', initial=True)
    resetting = State('Resetting')
    waiting_for_values = State('WaitingForValues')
    rebinding = State('Rebinding')
    waiting_for_bind = State('WaitingForBind')

    # transitions
    reset = monitoring.to(resetting)
    start_wait = resetting.to(waiting_for_values)
    try_bind = waiting_for_values.to(rebinding)
    wait_bind = rebinding.to(waiting_for_bind)
    monitor = waiting_for_bind.to(monitoring)
    restart_reset = waiting_for_bind.to(resetting)
    loop = monitoring.to(monitoring)

    def __init__(self, controller, check_interval=5, bind_timeout=100, rebind_timeout=100):
        self.ctrl = controller
        #self.flags = self.ctrl.ad_flags
        self.check_interval = check_interval
        self.bind_timeout = bind_timeout
        self.rebind_timeout = rebind_timeout
        self.stat_path = "adxdma/registers/adm_pcie_9v5_stat/"
        self.ctrl_path = "adxdma/registers/adm_pcie_9v5_ctrl/"
        self.proxy = self.ctrl.adapters['proxy']
        self.up = hex(0xfffff)
        # call the StateMachine init to register the states and transitions, 
        # once the rest of the init has finished
        super().__init__()

    def _get_status(self):
        stat = iac_get(self.proxy, self.stat_path, as_dict=True)
        return (stat['adm_pcie_9v5_stat']['aurora_chan_up']['value'], 
                stat['adm_pcie_9v5_stat']['aurora_lane_up']['value'])
    
    def on_enter_monitoring(self):
        """
            Initial state action for the SM, monitors the value of channel up and lane up
            registers, begings state transition to resetting if the values do not
            equal the check value.
        """
        chan, lane = self._get_status()
        bound = ((hex(int(chan)) == self.up) & (hex(int(lane)) == self.up))
        if not bound:
            logging.info("ADXDMA Lost packet binding, triggering reset")
            self.reset()
        else:
            logging.info("ADXDMA bound to hexitecmhz packets")
            time.sleep(self.check_interval)
    
    def on_enter_resetting(self):
        """
            Resetting state aciton, to send reset commands to AD card registers
            to clear the data path, begins state transistion to waiting
        """
        for register in ['aurora_reset', 'data_path_reset', 'cmac_0_reset']:
            iac_set(self.proxy, self.ctrl_path + "domain_resets/fields/", register, 1)
            iac_set(self.proxy, self.ctrl_path + "domain_resets/fields/", register, 0)
        self.start_wait()

    def on_enter_waiting_for_values(self):
        """
            Waiting for values state action, reads register values for channel and lane up, 
            looking for them to produce non-zero values indicating data is flowing 
            through the AD data path, if data flow is detected within timeout, begins 
            transistion to binding state, otherwise returns to monitoring to restart
            the process.
        """
        start = time.time()
        while time.time() - start < self.bind_timeout and self.ctrl.background_task_en:
            chan, lane = self._get_status()
            logging.debug(f"chan:{chan} | lane:{lane}")
            if ((chan != '0') or (lane != '0')):
                logging.debug("ADXDMA channels receiving data, re-binding")
                self.try_bind()
                return
            time.sleep(1)
        logging.warning("No values detected from ADXDMA channels, restarting reset cycle")
        self.monitor()

    def on_enter_rebinding(self):
        """
            Rebinding state action, tells the LOKI controller to send rebonding 
            packets to the AD card. Transistions to waiting for bind state.
        """
        iac_set(
            self.proxy,
            'loki/application/system_state',
            {'ASIC_REBOND': True}
        )
        logging.info("ASIC_REBOND command sent, waiting for binding to complete")
        self.wait_bind()

    def on_enter_waiting_for_bind(self):
        """
            Waiting for bon action, monitors the value of the channel and lane
            up registers within a timeout, return to monitoring state if they both
            equal the check value, else restart the resetting process and transition 
            back to resetting if AD card doesnt bond within timeout.
        """
        start = time.time()
        while time.time() - start < self.rebind_timeout and self.ctrl.background_task_en:
            chan, lane = self._get_status()
            bound = ((hex(int(chan)) == self.up) & (hex(int(lane)) == self.up))
            if bound:
                logging.info("ADXDMA successfully bound after rebind")
                self.monitor()
                return
            time.sleep(1)
        
        logging.warning("Rebind timeout - restarting reset cycle")
        self.restart_reset()


        

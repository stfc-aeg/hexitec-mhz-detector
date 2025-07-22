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
    initialising = State('Initialising', initial=True)
    monitoring = State('Monitoring')
    resetting = State('Resetting')
    waiting_for_values = State('WaitingForValues')
    rebonding = State('Rebonding')
    waiting_for_bond = State('WaitingForbond')
    error = State('Error')

    #transistions for init process
    init_success = initialising.to(monitoring)
    init_failed = initialising.to(error)

    # transitions for usual workflow
    reset = monitoring.to(resetting)
    start_wait = resetting.to(waiting_for_values)
    try_bond = waiting_for_values.to(rebonding)
    reset_from_values = waiting_for_values.to(resetting)
    wait_bond = rebonding.to(waiting_for_bond)
    monitor = waiting_for_bond.to(monitoring)
    reset_from_bond = waiting_for_bond.to(resetting)
    loop = monitoring.to(monitoring)

    # error transitions
    error_from_monitoring = monitoring.to(error)
    error_from_resetting = resetting.to(error)
    error_from_waiting = waiting_for_values.to(error)
    error_from_rebonding = rebonding.to(error)
    error_from_waiting_bond = waiting_for_bond.to(error)

    # recovery transistions
    recover = error.to(initialising)


    def __init__(self, controller, check_interval=5, bond_timeout=100, rebond_timeout=100):
        self.ctrl = controller
        #self.flags = self.ctrl.ad_flags
        self.check_interval = check_interval
        self.bond_timeout = bond_timeout
        self.rebond_timeout = rebond_timeout
        self.stat_path = "adxdma/registers/adm_pcie_9v5_stat/"
        self.ctrl_path = "adxdma/registers/adm_pcie_9v5_ctrl/"
        self.proxy = self.ctrl.adapters['proxy']
        self.up = hex(0xfffff)
        self.cleanup = False
        self.max_retries = 2
        self.current_retry = 0
        self.chan_up = 0
        self.lane_up = 0
        self.bonded = False
        # call the StateMachine init to register the states and transitions, 
        # once the rest of the init has finished
        super().__init__()

    def _get_status(self):
        try:
            stat = iac_get(self.proxy, self.stat_path, as_dict=True)
            return (stat['adm_pcie_9v5_stat']['aurora_chan_up']['value'], 
                    stat['adm_pcie_9v5_stat']['aurora_lane_up']['value'])
        except Exception as e:
            logging.error(f"Failed to get adxdma status: {e}")

    def _reset_retries(self, value):
        if self.current_retry >= self.max_retries:
            self.current_retry = 0
            self.init_failed()
        else:
            logging.error(f"Max retry not met, ignoring reset command")

    def on_enter_initialising(self):
        """
            Initialising state action, Initial action for the SM, tests
            proxy connection to adxdma adapter, transisitons to monitoring
            if successful else, goes to error state. 
        """
        try:
            if self.current_retry < self.max_retries:
                stat = iac_get(self.proxy, self.stat_path, as_dict=True)
                chan = (stat['adm_pcie_9v5_stat']['aurora_chan_up']['value'])
                self.current_retry = 0
                self.init_success()
        except:
            logging.error(f"Could not read ADXDMA parameters")
            self.init_failed()
            self.current_retry += 1

    def on_enter_monitoring(self):
        """
            Monitoring state actions, monitors the value of channel up and lane up
            registers, begings state transition to resetting if the values do not
            equal the check value.
        """
        try:
            chan, lane = self._get_status()
            self.bonded = ((hex(int(chan)) == self.up) & (hex(int(lane)) == self.up))
            if not self.bonded:
                logging.info("ADXDMA Lost packet bonding, triggering reset")
                self.reset()
            else:
                logging.info("ADXDMA bonded to hexitecmhz packets")
                time.sleep(self.check_interval)
            self.chan_up, self.lane_up = hex(int(chan)), hex(int(lane))
        except Exception as e:
            logging.error(f"Error in monitoring: {e}")
            self.error_from_monitoring()
    
    def on_enter_resetting(self):
        """
            Resetting state aciton, to send reset commands to AD card registers
            to clear the data path, begins state transistion to waiting
        """
        try:
            for register in ['aurora_reset', 'data_path_reset', 'cmac_0_reset']:
                iac_set(self.proxy, self.ctrl_path + "domain_resets/fields/", register, 1)
                iac_set(self.proxy, self.ctrl_path + "domain_resets/fields/", register, 0)
            self.start_wait()
        except Exception as e:
            logging.error(f"Error in resetting: {e}")
            self.error_from_resetting()

    def on_enter_waiting_for_values(self):
        """
            Waiting for values state action, reads register values for channel and lane up, 
            looking for them to produce non-zero values indicating data is flowing 
            through the AD data path, if data flow is detected within timeout, begins 
            transistion to bonding state, otherwise returns to monitoring to restart
            the process.
        """
        try:
            start = time.time()
            while (time.time() - start < self.bond_timeout and 
                self.ctrl.executor_threads_en and 
                    (not self.cleanup)):
                chan, lane = self._get_status()
                logging.debug(f"chan:{chan} | lane:{lane}")
                if ((chan != '0') or (lane != '0')):
                    logging.debug("ADXDMA channels receiving data, re-bonding")
                    self.try_bond()
                    return
                time.sleep(1)
            logging.error("No values detected from ADXDMA channels, restarting reset cycle")
            self.reset_from_values()
        except Exception as e:
            logging.error(f"Error in waiting for values: {e}")
            self.error_from_waiting()

    def on_enter_rebonding(self):
        """
            Rebonding state action, tells the LOKI controller to stop sending data
            and to then send rebonding packets to the AD card. Transistions to waiting 
            for bond state.
        """ 
        try:   
            iac_set(
                self.proxy,
                'loki/application/system_state',
                {'SYNC': False}
            )
            iac_set(
                self.proxy,
                'loki/application/system_state',
                {'ASIC_REBOND': True}
            )
            logging.info("ASIC_REBOND command sent, waiting for bonding to complete")
            self.wait_bond()
            return
        except Exception as e:
            logging.error(f"Error from rebonding: {e}")
            self.error_from_rebonding()

    def on_enter_waiting_for_bond(self):
        """
            Waiting for bon action, monitors the value of the channel and lane
            up registers within a timeout, return to monitoring state if they both
            equal the check value, else restart the resetting process and transition 
            back to resetting if AD card doesnt bond within timeout.
        """
        try:
            start = time.time()
            while (time.time() - start < self.bond_timeout and 
                self.ctrl.executor_threads_en and 
                    (not self.cleanup)):
                chan, lane = self._get_status()
                self.bonded = ((hex(int(chan)) == self.up) & (hex(int(lane)) == self.up))
                if self.bonded:
                    logging.info("ADXDMA successfully bonded after rebond")
                    # Tell loki to start sending data after bonding is complete
                    iac_set(
                        self.proxy,
                        'loki/application/system_state',
                        {'SYNC': True}
                    ) 
                    self.monitor()
                    return
                time.sleep(1)
            
            logging.warning("Rebond timeout - restarting reset cycle")
            self.reset_from_bond()
        except Exception as e:
            logging.error(f"Error from waiting for bond: {e}")
            self.error_from_waiting_bond()

    def on_enter_error(self):
        """
            Error state action, waits for a period then attempts recovery
            by going through the initialisation process
        """
        logging.info("Attempting recovery through initialisation")
        self.recover()
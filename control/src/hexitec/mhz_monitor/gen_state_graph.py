from statemachine.contrib.diagram import quickchart_write_svg
from hexitec.mhz_monitor.state_machine import Monitor, MonitorControl


monitor = Monitor({"proxy": None, "readout": None})
sm = MonitorControl(monitor)
print([s.name for s in sm.states])
quickchart_write_svg(sm, "state_graph.svg")

template = {
    'charge_pos_edge'     : {'value': None, 'adapter': 'histogrammer', 'path': 'config/charge_sharing/positive_edge'},
    'charge_sum_enable'   : {'value': None, 'adapter': 'histogrammer', 'path': 'config/charge_sharing/sum_enable'},
    'charge_neg_neighbour': {'value': None, 'adapter': 'histogrammer', 'path': 'config/charge_sharing/negative_neighbour'},
    'charge_pos_adjust'   : {'value': None, 'adapter': 'histogrammer', 'path': 'config/charge_sharing/position_adjust'},

    'thres_abs_low_default'  : {'value': None, 'adapter': 'histogrammer', 'path': 'config/thresholds/absolute/low'},
    'thres_abs_high_default' : {'value': None, 'adapter': 'histogrammer', 'path': 'config/thresholds/absolute/high'},
    'thres_low_neg_default'  : {'value': None, 'adapter': 'histogrammer', 'path': 'config/thresholds/low/neg'},
    'thres_low_pos_default'  : {'value': None, 'adapter': 'histogrammer', 'path': 'config/thresholds/low/pos'},
    'thres_main_neg_default' : {'value': None, 'adapter': 'histogrammer', 'path': 'config/thresholds/main/neg'},
    'thres_main_pos_default' : {'value': None, 'adapter': 'histogrammer', 'path': 'config/thresholds/main/pos'},

    'baseline_divide'      : {'value': None, 'adapter': 'histogrammer', 'path': 'config/baseline/divide'},
    'baseline_dither'      : {'value': None, 'adapter': 'histogrammer', 'path': 'config/baseline/dither'},
    'dark_tracking_enable' : {'value': None, 'adapter': 'acquisition', 'path': 'toggle_baseline'},

    'auto_trigger_mode': {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/auto_trig_mode'},
    'cluster_mode'     : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/mode'},
    # Cluster types: True/False
    'cluster_hoz'      : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/HOZ'},
    'cluster_hoz_nl'   : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/HOZ_NL'},
    'cluster_hoz_nr'   : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/HOZ_NR'},
    'cluster_vert'     : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/VERT'},
    'cluster_vert_na'  : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/VERT_NA'},
    'cluster_vert_nb'  : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/VERT_NB'},
    'cluster_diag1'    : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/DIAG1'},
    'cluster_diag1nl'  : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/DIAG1NL'},
    'cluster_diag1nr'  : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/DIAG1NR'},
    'cluster_diag2'    : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/DIAG2'},
    'cluster_diag2nl'  : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/DIAG2NL'},
    'cluster_diag2nr'  : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/DIAG2NR'},
    'cluster_quad'     : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/QUAD'},
    'cluster_all'      : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/ALL'},
    'cluster_lone'     : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/LONE'},
    'cluster_l1'       : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/L1'},
    'cluster_l2'       : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/L2'},
    'cluster_l3'       : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/L3'},
    'cluster_l4'       : {'value': None, 'adapter': 'histogrammer', 'path': 'config/clustering/types/L4'},

    # LOKI controls
    'highvoltage_enable'      : {'value': None, 'adapter': 'proxy', 'path': 'loki/application/HV/ENABLE'},
    'highvoltage_target_bias' : {'value': None, 'adapter': 'proxy', 'path': 'loki/application/HV/target_bias'},
    'peltier_enable'          : {'value': None, 'adapter': 'proxy', 'path': 'loki/application/peltier/enable'},
    'peltier_setpoint'        : {'value': None, 'adapter': 'proxy', 'path': 'loki/application/peltier/temperature'},
    'feedback_capacitance'    : {'value': None, 'adapter': 'proxy', 'path': 'loki/application/asic_settings/feedback_capacitance'},
    'negative_dynamic_range'  : {'value': None, 'adapter': 'proxy', 'path': 'loki/application/asic_settings/negative_range_lowhigh'}
}
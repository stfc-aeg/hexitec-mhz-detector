mapping = {
    'charge_pos_edge'     : 'histogrammer/config/charge_sharing/positive_edge',
    'charge_sum_enable'   : 'histogrammer/config/charge_sharing/sum_enable',
    'charge_neg_neighbour': 'histogrammer/config/charge_sharing/negative_neighbour',
    'charge_pos_adjust'   : 'histogrammer/config/charge_sharing/position_adjust',

    'thres_abs_low_default'  : 'histogrammer/config/thresholds/absolute/low',
    'thres_abs_high_default' : 'histogrammer/config/thresholds/absolute/high',
    'thres_low_neg_default'  : 'histogrammer/config/thresholds/low/neg',
    'thres_low_pos_default'  : 'histogrammer/config/thresholds/low/pos',
    'thres_main_neg_default' : 'histogrammer/config/thresholds/main/neg',
    'thres_main_pos_default' : 'histogrammer/config/thresholds/main/pos',

    'baseline_divide'      : 'histogrammer/config/baseline/divide',
    'baseline_dither'      : 'histogrammer/config/baseline/dither',
    'dark_tracking_enable' : 'acquisition/toggle_baseline',

    'auto_trigger_mode': 'histogrammer/config/clustering/auto_trig_mode',
    'cluster_mode'     : 'histogrammer/config/clustering/mode',
    # Cluster types: True/False
    'cluster_hoz'      : 'histogrammer/config/clustering/types/HOZ',
    'cluster_hoz_nl'   : 'histogrammer/config/clustering/types/HOZ_NL',
    'cluster_hoz_nr'   : 'histogrammer/config/clustering/types/HOZ_NR',
    'cluster_vert'     : 'histogrammer/config/clustering/types/VERT',
    'cluster_vert_na'  : 'histogrammer/config/clustering/types/VERT_NA',
    'cluster_vert_nb'  : 'histogrammer/config/clustering/types/VERT_NB',
    'cluster_diag1'    : 'histogrammer/config/clustering/types/DIAG1',
    'cluster_diag1nl'  : 'histogrammer/config/clustering/types/DIAG1NL',
    'cluster_diag1nr'  : 'histogrammer/config/clustering/types/DIAG1NR',
    'cluster_diag2'    : 'histogrammer/config/clustering/types/DIAG2',
    'cluster_diag2nl'  : 'histogrammer/config/clustering/types/DIAG2NL',
    'cluster_diag2nr'  : 'histogrammer/config/clustering/types/DIAG2NR',
    'cluster_quad'     : 'histogrammer/config/clustering/types/QUAD',
    'cluster_all'      : 'histogrammer/config/clustering/types/ALL',
    'cluster_lone'     : 'histogrammer/config/clustering/types/LONE',
    'cluster_l1'       : 'histogrammer/config/clustering/types/L1',
    'cluster_l2'       : 'histogrammer/config/clustering/types/L2',
    'cluster_l3'       : 'histogrammer/config/clustering/types/L3',
    'cluster_l4'       : 'histogrammer/config/clustering/types/L4',

    # LOKI controls
    'highvoltage_enable'      : 'proxy/loki/application/HV/ENABLE',
    'highvoltage_target_bias' : 'proxy/loki/application/HV/target_bias',
    'peltier_enable'          : 'proxy/loki/application/peltier/enable',
    'peltier_setpoint'        : 'proxy/loki/application/peltier/temperature',
    'feedback_capacitance'    : 'proxy/loki/application/asic_settings/feedback_capacitance',
    'negative_dynamic_range'  : 'proxy/loki/application/asic_settings/negative_range_lowhigh'
}
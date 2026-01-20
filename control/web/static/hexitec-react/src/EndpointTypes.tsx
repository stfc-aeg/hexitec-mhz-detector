import type { ParamTree } from 'odin-react';

export interface MetadataType {
  value: any;
  writeable: boolean;
  min?: number;
  max?: number;
  allowed_values?: any[]
}

export interface HistogramTypes extends ParamTree {
  acquisition: {
    count: {
      complete_time_frames: number;
      detector_frames: number;
      raw_hits: number;
      udp_frames: number;
    };
    input_frames: number;
    itfg: {
      input_frames: number;
      output_frames: number;
      status: string;
    };
    mode: string;
    output_frames: number;
    run: boolean;
    duration: number;
  };
  config: {
    baseline: {
      dither: boolean;
      divide: number;
      mask: string;
    };
    charge_sharing: {
      l3_filename: string;
      l3_load: any;
      mc_filename: string;
      mc_load: any;
      negative_neighbour: boolean;
      pos_filename: string;
      pos_load: any;
      position_adjust: boolean;
      positive_edge: boolean;
      sum_enable: boolean;
    };
    hdf_filename: string;
    linearity_correction: {
      gain_filename: string;
      gain_load: any;
      lin_filename: string;
      lin_load: any;
      offset: number;
      scale: number;
    };
    load_hdf: any;
    save_hdf: any;
    clustering: {
      auto_trig_mode: string;
      mode: string;
      types: {
        diag1: boolean;
        diag1nl: boolean;
        diag1nr: boolean;
        diag2: boolean;
        diag2nl: boolean;
        diag2nr: boolean;
        hoz: boolean;
        "hoz nl": boolean;
        "hoz nr": boolean;
        l1: boolean;
        l2: boolean;
        l3: boolean;
        l4: boolean;
        lone: boolean;
        quad: boolean;
        vert: boolean;
        "vert na": boolean;
        "vert nb": boolean;
      };
    };
    hist_format: {
      mapped_mode: string;
      num_bins: number;
      run_mode: string;
    };
    thresholds: {
      absolute: number[];
      low: number[];
      main: number[];
    };
  };
  device: {
    connect: boolean;
    device_num: number;
    status: string;
  };
  udp: {
    accelerator: {
      port: number;
      rx_ip: string;
      tx_ip: string;
    };
    destination: {
      ip: string;
      port: number;
    };
    setup: any;
    source: {
      ip: string;
      port: number;
    };
    udp_threads: number;
  };
}

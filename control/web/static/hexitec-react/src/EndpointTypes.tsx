import type { ParamNode } from '@dssg/odin-react';;

export interface MetadataType<T> {
  value: T;
  writeable: boolean;
  min?: number;
  max?: number;
  allowed_values?: T[]
}

// Histogram Endpoint Types

export interface HistogramTypes extends ParamNode {
  acquisition: {
    count: {
      output_time_frames: number;
      detector_frames: number;
      raw_hits: number;
      input_time_frames: number;
    };
    itfg: {
      remaining_in: number;
      num_out: number;
      status: string;
    };
    frames_per_histogram: number;
    mode: string;
    num_histograms: number;
    run: boolean;
  };
  config: {
    baseline: {
      dither: boolean;
      divide: number;
      init_baseline: boolean;
      mask: string;
    };
    charge_sharing: {
      l3_filename: string;
      l3_load: null;
      mc_filename: string;
      mc_load: null;
      negative_neighbour: boolean;
      pos_filename: string;
      pos_load: null;
      position_adjust: boolean;
      positive_edge: boolean;
      sum_enable: boolean;
    };
    hdf_settings: {
      filename: string;
      save: null;
      load: null;
      available: string[];
    };
    hdf_filename: string;
    linearity_correction: {
      gain_filename: string;
      gain_load: null;
      lin_filename: string;
      lin_load: null;
      offset: number;
      scale: number;
    };
    load_hdf: null;
    save_hdf: null;
    clustering: {
      auto_trig_mode: string;
      mode: string;
      types: {
        DIAG1: boolean;
        DIAG1NL: boolean;
        DIAG1NR: boolean;
        DIAG2: boolean;
        DIAG2NL: boolean;
        DIAG2NR: boolean;
        HOZ: boolean;
        HOZ_NL: boolean;
        HOZ_NR: boolean;
        L1: boolean;
        L2: boolean;
        L3: boolean;
        L4: boolean;
        LONE: boolean;
        QUAD: boolean;
        VERT: boolean;
        VERT_NA: boolean;
        VERT_NB: boolean;
      };
    };
    hist_format: {
      bad_pixel_mask: {
        filename: string;
        load: null;
      };
      mapped_mode: string;
      num_bins: number;
      run_mode: string;
    };
    thresholds: {
      absolute: {
        high: number;
        low: number;
      };
      low: {
        neg: number;
        pos: number;
      }
      main: {
        neg: number;
        pos: number;
      };
      bad_pixel: {
        filename: string;
        load: null;
      };
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
    setup: null;
    source: {
      ip: string;
      port: number;
    };
    udp_threads: number;
  };
}

// Munir Endpoint Types

export interface MunirTypes {
  execute: {
    hexitec_mhz: boolean;
  };
  subsystem_list: string[];
  subsystems: {
    hexitec_mhz: {
      args: {
        file_name: string;
        file_path: string;
        num_batches: number;
        num_frames: number;
      };
      endpoints: string[];
      frame_procs: {
        status: FrameProcStatus[];
      };
      start_lv_frames: null | number;
      status: {
        executing: boolean;
        frames_written: number;
      };
      stop_execute: null | boolean;
      timeout: number;
    };
  }
};

export interface HexitecMhzStatus {
  FrameWrapperCore_0: {
    core_usage: number;
    frames_processed: number;
    frames_processed_per_second: number;
    idle_loops: number;
    last_frame_number: number;
    timing: {
      max_frame_us: number;
      mean_frame_us: number;
    };
    upstream_rings: {
      FrameBuilderCore_00_0_count: number;
      FrameBuilderCore_00_0_size: number;
      clear_frames_0_count: number;
      clear_frames_0_size: number;
    };
  };
  available_modes: string[];
  bit_depth: string;
  core_manager: {
    shared_buffer_size: number;
  };
  decoder_initialized: boolean;
  framebuildercore_0: {
    core_usage: number;
    frames_processed: number;
    frames_processed_per_second: number;
    idle_loops: number;
    timing: {
      max_frame_us: number;
      mean_frame_us: number;
    };
    upstream_rings: {
      PacketProcessorCore_00_0_count: number;
      PacketProcessorCore_00_0_size: number;
    };
  };
  framebuildercore_1: {
    core_usage: number;
    frames_processed: number;
    frames_processed_per_second: number;
    idle_loops: number;
    timing: {
      max_frame_us: number;
      mean_frame_us: number;
    };
    upstream_rings: {
      PacketProcessorCore_01_0_count: number;
      PacketProcessorCore_01_0_size: number;
    };
  };
  mode: string;
  packetprocessorcore_0: {
    core_usage: number;
    dropped_frames: number;
    dropped_packets: number;
    frame_buffer_size: number;
    frames_incomplete: number;
    frames_processed: number;
    frames_processed_per_second: number;
    idle_loops: number;
    packets_total: number;
    timing: {
      max_frame_us: number;
      mean_frame_us: number;
    };
    upstream_rings: {
      PacketRxCore_00_0_count: number;
      PacketRxCore_00_0_size: number;
    };
  };
  packetprocessorcore_1: {
    core_usage: number;
    dropped_frames: number;
    dropped_packets: number;
    frame_buffer_size: number;
    frames_incomplete: number;
    frames_processed: number;
    frames_processed_per_second: number;
    idle_loops: number;
    packets_total: number;
    timing: {
      max_frame_us: number;
      mean_frame_us: number;
    };
    upstream_rings: {
      PacketRxCore_01_0_count: number;
      PacketRxCore_01_0_size: number;
    };
  };
  packetrxcore_0: {
    captured_packets: number;
    dropped_packets: number;
    first_frame_number: number;
    first_seen_frame_number: number;
    forward_ring_0_count: number;
    forward_ring_0_free: number;
    forward_ring_0_size: number;
    forward_ring_0_utilization_pct: number;
    forward_ring_1_count: number;
    forward_ring_1_free: number;
    forward_ring_1_size: number;
    forward_ring_1_utilization_pct: number;
    max_packet_queue_retries: number;
    mbuf_pool_available: number;
    mbuf_pool_in_use: number;
    mbuf_pool_total: number;
    mbuf_pool_utilization_pct: number;
    num_downstream_cores: number;
    port_xstats: {
      tx_multicast_bytes: number;
      tx_multicast_packets: number;
      tx_phy_bytes: number;
      tx_phy_packets: number;
    };
    release_ring_count: number;
    release_ring_free: number;
    release_ring_size: number;
    release_ring_utilization_pct: number;
    rx_burst_size: number;
    rx_enable: boolean;
    rx_frames: number;
    rx_queue_packet_count: number;
    total_packets: number;
  };
  packets_per_frame: number;
  payload_size: number;
  timing: {
    last_process: number;
    max_process: number;
    mean_process: number;
  };
}

export interface FrameProcStatus {
  HexitecMhz: HexitecMhzStatus;
  Liveview: {
    timing: {
      last_process: number;
      max_process: number;
      mean_process: number;
    };
  };
  hdf: {
    acquisition_id: string;
    file_name: string;
    file_path: string;
    frames_max: number;
    frames_processed: number;
    frames_written: number;
    processes: number;
    rank: number;
    timeout_active: boolean;
    timing: {
      last_close: number;
      last_create: number;
      last_flush: number;
      last_process: number;
      last_write: number;
      max_close: number;
      max_create: number;
      max_flush: number;
      max_process: number;
      max_write: number;
      mean_close: number;
      mean_create: number;
      mean_flush: number;
      mean_process: number;
      mean_write: number;
    };
    writing: boolean;
  };
  plugins: {
    names: string[];
  };
  shared_memory: {
    configured: boolean;
  };
}

export interface AcquisitionTypes extends ParamNode{
  config: {
    baseline: {
      toggle: boolean;
    };
    bin_mode: string;
    estimated_data_rate: number;
    config_edit_mode: boolean;
    trigger: {
      device: string;
      frames_per_timeframe: number;
      frames_pre_multiplier: number;
      frame_multiplier: string;
      number_of_timeframes: number;
      timeframes_per_trigger: number;
      trigger_mode: string;
    };
  };
  state: {
    acquisition: {
      add_timestamp: boolean;
      file_name: string;
      file_path: string;
      toggle: boolean;
      progress_task: {
        interval: number;
        progress: number;
      }
    };
    preview: {
      frames_per_hist: number;
      toggle: boolean;
    };
  };
}



// Proxy endpoint types

export type LokiEnvironmentParams = {
  // This is not all the values but just the ones used here.
  temperature: {
    DIODE: number;
    BLOCK: number;
    DEWPOINT: number;
  }
  humidity: {
    BOARD: number;
  }
};

export type LokiApplicationData = {
  vcal?: number;
  HV: {
    ENABLE: number;
    readback_bias: number;
    target_bias: number;
  };
  peltier: {
    proportion: number;
    proportion_save: boolean;
    count: number;
    temperature: number;
    enable: boolean;
    mode: string;
    modes_available: string[];
  }
  asic_settings: {
    feedback_capacitance: number;
    feedback_gain: string;
    negative_range_kev: number;
    negative_range_lowhigh: string;
    negative_range_options: {
      low: number;
      high: number;
    };
    segment_readout: {
      SEGMENT_DATA: number[][];
      REQUEST: boolean;
      SEGMENT_SELECT: number;
    };
    calibration_pattern: {
      ENABLE: number;
      MODE: string;
      DIRECT_MAP: number[][];
      MODES: {
        PRESET: {
          AVAIL: string[];
          SELECT: string;
        };
      };
    };
  }
};

export type LokiCarrierParams = {
  environment: LokiEnvironmentParams;
  application: LokiApplicationData;
};

export interface ProxyParams {
  loki: LokiCarrierParams
  status: {
    loki: {
      url: string;
      status_code: number;
      error: string;
      last_update: string;
    }
  }
}

export interface ConfigTypes {
  available_profiles: string[];
  create_profile: null;
  current_profile: string;
  profiles_filepath: string;
  set_mapping: null;
}


export interface ReadoutTypes {
  control: {
    close: null;
    connected: boolean;
    open: null;
  };
  status: {
    acq_control: {
      acquire: number;
      acquisition_abort: number;
      manual_trig: number;
    },
    aurora: {
      channel: boolean;
      lane: boolean;
    };
    clock_resets: {
      aurora_reset: number;
      cmac_0_reset: number;
      cmac_1_reset: number;
      cmac_2_reset: number;
      data_path_reset: number;
    };
    cmac: {
      cmac_0_lane_up: number;
      cmac_1_lane_up: number;
    };
    frame_changing: boolean;
    frame_number: number;
    is_running: boolean;
    reactivate: null;
    reset: null;
  };
  trigger: {
    acquisition_count: number;
    debug_trigger: null;
    enable: boolean;
    frame_limits: {
      acquisition: number;
      frame_in_hist: number;
      hist_in_trigger: number;
    };
    mode: string;
    polarity: string;
    reset_time_frame: boolean;
    timeframe_count: number;
  };
  udp: {
    core_0: {
      dest_ip: string;
      dest_mac: string;
      src_ip: string;
      src_mac: string;
    };
    core_1: {
      dest_ip: string;
      dest_mac: string;
      src_ip: string;
      src_mac: string;
    };
  }
}

import type { ParamTree } from 'odin-react';

export interface MetadataType {
  value: any;
  writeable: boolean;
  min?: number;
  max?: number;
  allowed_values?: any[]
}

// Histogram Endpoint Types

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
      bad_pixel_mask: {
        filename: string;
        load: null;
      };
      mapped_mode: string;
      num_bins: number;
      run_mode: string;
    };
    thresholds: {
      absolute: number[];
      low: number[];
      main: number[];
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
    setup: any;
    source: {
      ip: string;
      port: number;
    };
    udp_threads: number;
  };
}

// Munir Endpoint Types

export interface MunirTypes extends ParamTree {
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

export interface HexitecMhzStatus extends ParamTree{
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

export interface FrameProcStatus extends ParamTree{
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

export interface AcquisitionTypes extends ParamTree {
  acquisition: {
    start: null;
    stop: null;
    acquiring: boolean;
  };
  config: {
    bin_mode: string;
    trigger: {
      device: string;
      mode: string;
      frames_per_timeframe: number;
      number_of_timeframes: number;
    };
  };

}
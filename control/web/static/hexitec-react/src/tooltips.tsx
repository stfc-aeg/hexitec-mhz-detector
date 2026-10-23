import { Tooltip } from 'react-bootstrap';

/**
 * Centralized tooltip definitions for the application.
 * This prevents tooltip duplication and keeps UI text in one place.
 */

export const tooltips = {
  acquisition: {
    hardware: (
      <Tooltip id="tooltip-hardware">
        <strong>Hardware Trigger.</strong> The detector is triggered by external hardware signals.
      </Tooltip>
    ),
    software: (
      <Tooltip id="tooltip-software">
        <strong>Software Trigger.</strong> The detector is triggered through the alveo module.
      </Tooltip>
    ),
    burst_mode: (
      <Tooltip id="tooltip-burst-mode">
        <strong>Burst Mode.</strong> On trigger, capture a specified number of timeframes, each with a specified number of frames.
      </Tooltip>
    ),
    step_scan: (
      <Tooltip id="tooltip-step-scan">
        <strong>Step Scan.</strong> On trigger, the specified number of frames are added to one timeframe.
      </Tooltip>
    ),
    continuous_mode: (
      <Tooltip id="tooltip-continuous-mode">
        <strong>Continuous Mode.</strong> On trigger, frames are continuously assigned to one timeframe; the next trigger increments the timeframe.
      </Tooltip>
    ),
    endless_acquisition: (
      <Tooltip id="tooltip-endless-acquisition">
        <strong>No frame target.</strong> The acquisition runs until stopped manually, with no frame target.
      </Tooltip>
    ),
    multiple_file_acquisition: (
      <Tooltip id="tooltip-multiple-file">
        <strong>Multiple Output Files.</strong> Specified number of timeframes are written to each file. Name appended with incrementing number.
      </Tooltip>
    ),
    est_duration: (
      <Tooltip id="tooltip-duration">
        <strong>Duration.</strong> With hardware triggering, the duration is estimated per-trigger.
      </Tooltip>
    ),
    low_frames_per_timeframe: (
      <Tooltip id="tooltip-low-frames-per-timeframe">
        <strong>Fast Histograms.</strong> A very low number of frames per timeframe may be less efficient than raw data.
      </Tooltip>
    ),
    disabled_acquiring: (
      <Tooltip id="tooltip-acq-disabled">
        <strong>Acquisition in progress.</strong> Configuration is locked while an acquisition or preview is running.
      </Tooltip>
    ),
    disabled_edit: (
      <Tooltip id="tooltip-edit-disabled">
        <strong>Editing disabled.</strong> Enable 'Edit Config' above to make changes to configuration parameters.
      </Tooltip>
    )
  },
  processing: {
    chargeSharing: (
      <Tooltip id="tooltip-charge-sharing">
        <strong>Charge Sharing.</strong> _
      </Tooltip>
    ),
    baseline_toggle: (
      <Tooltip id="tooltip-baseline-toggle">
        <strong>Dark Tracking Toggle.</strong> Enabling this may lead to some dropped frames due to the settings it requires.
      </Tooltip>
    )
  },
  liveview: {
    region_selection: (
        <Tooltip id="tooltip-region-selection">
            <strong>Region Selection.</strong> The histogram below will only be for the selected region. <em>Click+Drag on the counts map for the same selection. Right-click to clear.</em>
        </Tooltip>
    ),
    energybin_range: (
      <Tooltip id="tooltip-energybin-range">
        <strong>Energy Bin Range.</strong> Only values within the selected range of energy bins will appear in the counts map. <em>Click+Drag on the histogram for the same selection. Right-click to clear.</em>
      </Tooltip> 
    )
  }
};

export type TooltipKey = keyof typeof tooltips;

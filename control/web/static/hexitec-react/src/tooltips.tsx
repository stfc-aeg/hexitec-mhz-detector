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
    est_duration: (
      <Tooltip id="tooltip-duration">
        <strong>Duration.</strong> With hardware triggering, the duration is estimated per-trigger.
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

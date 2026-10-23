import { EndpointSelect, EndpointButton } from '@dssg/odin-react';;
import type { AdapterEndpoint } from '@dssg/odin-react';;
import { InputGroup } from 'react-bootstrap';

// Convenience component for picking a file to send to an endpoint
// This component does assume the histogrammer component as all config files are loaded there

interface FilePickerProps {
  endpoint: AdapterEndpoint;
  fullpath: string;
  buttonText: string;  // e.g. endpoint.data?.path_a.path_b.param
  select_options?: string[];
  defaultLabel?: string;
  loadButton?: boolean;  // Do you need a button to load the file
  loadPath?: string;  // Optional as is the button
  disabled?: boolean; 
}

export function FilePicker({ endpoint, fullpath, buttonText, select_options, defaultLabel="Select file...", loadButton=true, loadPath, disabled=false}: FilePickerProps) {
  const options = Array.isArray(select_options) ? select_options : [];

  return (
    <InputGroup>
      <EndpointSelect
        endpoint={endpoint}
        fullpath={fullpath}
        defaultValue=""
        disabled={disabled}
      >
        <option value="" disabled>{defaultLabel}</option>
        {options
          .filter((selection): selection is string => Boolean(selection))  // Removes non-truthy options like "" or null
          .map(
          (selection) => (
            <option value={selection} key={selection}>
              {selection}
            </option>
          )
        )}
      </EndpointSelect>
      { loadButton ?
        <EndpointButton
          endpoint={endpoint}
          fullpath={loadPath ?? fullpath}
          value={buttonText}
          disabled={buttonText === "" || disabled}
        >
          Load file
        </EndpointButton>
        : <></>
      }
    </InputGroup>
  );
}

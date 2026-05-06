import { WithEndpoint, EndpointButton } from 'odin-react';
import type { AdapterEndpoint } from 'odin-react';
import type { MetadataType } from '../EndpointTypes';
import { Form, InputGroup } from 'react-bootstrap';

// Convenience component for picking a file to send to an endpoint
// This component does assume the histogrammer component as all config files are loaded there

interface FilePickerProps {
  endpoint: AdapterEndpoint;
  fullpath: string;
  buttonText: string;  // e.g. endpoint.data.path_a.path_b.param
  param_metadata?: MetadataType<string>;
  defaultLabel?: string;
  loadButton?: boolean;  // Do you need a button to load the file
  loadPath?: string;  // Optional as is the button
}

const EndpointSelect = WithEndpoint(Form.Select);

export function FilePicker({ endpoint, fullpath, buttonText, param_metadata, defaultLabel="Select file...", loadButton=true, }: FilePickerProps) {
  return (
    <InputGroup>
      <EndpointSelect
        endpoint={endpoint}
        fullpath={fullpath}
        variant='outline-secondary'
        value={buttonText}
      >
        <option value="" disabled>{defaultLabel}</option>
        {(param_metadata?.allowed_values ?? [])
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
          fullpath={fullpath}
          value={true}
          variant='primary'
          disabled={!(buttonText !== "")}
        >
          Load file
        </EndpointButton>
        : <></>
      }
    </InputGroup>
  );
}

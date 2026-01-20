import { WithEndpoint } from 'odin-react';
import type { MetadataType } from '../EndpointTypes';
import { Form, InputGroup, Button } from 'react-bootstrap';

// Convenience component for picking a file to send to an endpoint
// This component does assume the histogrammer component as all config files are loaded there

interface FilePickerProps {
  endpoint: any;
  fullpath: string;
  buttonText: any;  // e.g. endpoint.data.path_a.path_b.param
  param_metadata: MetadataType | undefined;
  label?: string;
  loadButton?: boolean;  // Do you need a button to load the file
  loadPath?: string;  // Optional as is the button
}

const EndpointSelect = WithEndpoint(Form.Select);
const EndpointButton = WithEndpoint(Button);

export function FilePicker({ endpoint, fullpath, buttonText, param_metadata, label="Select file:", loadButton=true, loadPath=fullpath }: FilePickerProps) {
  return (
    <InputGroup>
      <InputGroup.Text>{label}</InputGroup.Text>
      <EndpointSelect
        endpoint={endpoint}
        fullpath={fullpath}
        variant='outline-secondary'
        value={buttonText}
      >
        {(param_metadata?.allowed_values ?? []).map(
          (selection, index) => (
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

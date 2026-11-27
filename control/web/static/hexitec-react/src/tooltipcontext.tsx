import { createContext, useContext, useState, type ReactNode } from 'react';
import { OverlayTrigger, type OverlayTriggerProps } from 'react-bootstrap';

interface TooltipContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const TooltipContext = createContext<TooltipContextValue>({
  enabled: true,
  setEnabled: () => {},
});

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem('tooltips-enabled') !== 'false'
  );

  const updateEnabled = (value: boolean) => {
    localStorage.setItem('tooltips-enabled', String(value));
    setEnabled(value);
  };

  return (
    <TooltipContext.Provider value={{ enabled, setEnabled: updateEnabled }}>
      {children}
    </TooltipContext.Provider>
  );
}

export function useTooltips() {
  return useContext(TooltipContext);
}

export function AppOverlayTrigger(props: OverlayTriggerProps) {
  const { enabled } = useTooltips();

  if (!enabled) {
    return <>{props.children}</>;
  }

  return <OverlayTrigger {...props} />;
}
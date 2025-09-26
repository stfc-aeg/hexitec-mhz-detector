import React from 'react';
import { useAdapterEndpoint } from 'odin-react';

interface UserAwareProps {
  children: React.ReactNode;
  userLevel: 'basic' | 'power';
  endpoint_url?: string;
}

export function UserAware({ children, userLevel, endpoint_url }: UserAwareProps) {
  const url = endpoint_url || import.meta.env.VITE_ENDPOINT_URL;
  const endpoint = useAdapterEndpoint('hexitec', url, 1000);
  
  const currentUserType = endpoint.data?.user_type || 'basic';
   
  // Show if user is power user or if the required level matches current user
  const shouldShow = currentUserType === 'power' || currentUserType === userLevel;
  
  if (!shouldShow) {
    return null;
  }
  
  return <>{children}</>;
}
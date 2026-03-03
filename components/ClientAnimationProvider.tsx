'use client';

import React from 'react';
import { AnimationProvider } from '@/contexts/AnimationContext';

interface ClientAnimationProviderProps {
  children: React.ReactNode;
}

const ClientAnimationProvider: React.FC<ClientAnimationProviderProps> = ({ children }) => {
  return (
    <AnimationProvider>
      {children}
    </AnimationProvider>
  );
};

export default ClientAnimationProvider;

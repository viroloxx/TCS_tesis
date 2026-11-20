import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MaskingContextType {
  isMasked: boolean;
  toggleMasking: () => void;
}

const MaskingContext = createContext<MaskingContextType | undefined>(undefined);

export const MaskingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMasked, setIsMasked] = useState<boolean>(false);

  const toggleMasking = () => {
    setIsMasked((prev) => !prev);
  };

  return (
    <MaskingContext.Provider value={{ isMasked, toggleMasking }}>
      {children}
    </MaskingContext.Provider>
  );
};

export const useMasking = (): MaskingContextType => {
  const context = useContext(MaskingContext);
  if (!context) {
    throw new Error('useMasking debe usarse dentro de un MaskingProvider');
  }
  return context;
};

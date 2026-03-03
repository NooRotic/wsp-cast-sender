"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface AnimationContextType {
  heroAnimationsComplete: boolean;
  setHeroAnimationsComplete: (complete: boolean) => void;
  userHasScrolled: boolean;
  setUserHasScrolled: (scrolled: boolean) => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(
  undefined
);

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [heroAnimationsComplete, setHeroAnimationsComplete] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  return (
    <AnimationContext.Provider
      value={{
        heroAnimationsComplete,
        setHeroAnimationsComplete,
        userHasScrolled,
        setUserHasScrolled,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation() {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error("useAnimation must be used within an AnimationProvider");
  }
  return context;
}

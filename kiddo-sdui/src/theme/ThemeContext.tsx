import { createContext, useContext } from 'react';
import { Theme } from '../types/schema';

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({
  value,
  children,
}: {
  value: Theme;
  children: React.ReactNode;
}) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * useTheme — reads the current OTA theme from the active payload.
 * Changing the payload's theme object re-renders every consumer
 * without any app rebuild. This is the "OTA runtime theming" requirement.
 */
export function useTheme(): Theme {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('useTheme must be used inside a <ThemeProvider>');
  return t;
}

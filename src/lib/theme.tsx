import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UserSettings } from './types';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystem(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({
  children,
  settings,
}: {
  children: ReactNode;
  settings: UserSettings | null;
}) {
  const [mode, setModeState] = useState<ThemeMode>(settings?.theme || 'system');
  const [resolved, setResolved] = useState<'light' | 'dark'>(getSystem());

  useEffect(() => {
    setModeState(settings?.theme || 'system');
  }, [settings?.theme]);

  useEffect(() => {
    const apply = () => {
      const r = mode === 'system' ? getSystem() : mode;
      setResolved(r);
      const root = document.documentElement;
      if (r === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
    };
    apply();
    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [mode]);

  const setMode = (m: ThemeMode) => setModeState(m);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { useColorScheme } from 'react-native';
import { idnTokens, type IdnTheme } from './tokens';

export type ThemePreference = 'light' | 'dark' | 'auto';

const THEME_KEY = 'idn.theme';

type ThemePreferenceValue = {
  preference: ThemePreference;
  dark: boolean;
  hydrated: boolean;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemePreferenceContext = React.createContext<ThemePreferenceValue | null>(null);

export function idnTheme(dark: boolean): IdnTheme {
  const n = dark ? idnTokens.d : idnTokens.l;
  return { ...idnTokens, ...n, dark };
}

export function useIdnTheme(): IdnTheme {
  const context = React.useContext(ThemePreferenceContext);
  const scheme = useColorScheme();
  return idnTheme(context?.dark ?? scheme === 'dark');
}

export function useThemePreference(): ThemePreferenceValue {
  const context = React.useContext(ThemePreferenceContext);
  if (!context) throw new Error('useThemePreference doit être utilisé dans ThemePreferenceProvider.');
  return context;
}

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [preference, setPreferenceState] = React.useState<ThemePreference>('auto');
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    void AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'auto') setPreferenceState(stored);
      })
      .finally(() => setHydrated(true));
  }, []);

  const setPreference = React.useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    await AsyncStorage.setItem(THEME_KEY, next);
  }, []);

  const dark = preference === 'dark' || (preference === 'auto' && scheme === 'dark');
  const value = React.useMemo(() => ({ preference, dark, hydrated, setPreference }), [dark, hydrated, preference, setPreference]);

  return React.createElement(ThemePreferenceContext.Provider, { value }, children);
}

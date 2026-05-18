import { useColorScheme } from 'react-native';
import { idnTokens, type IdnTheme } from './tokens';

export function idnTheme(dark: boolean): IdnTheme {
  const n = dark ? idnTokens.d : idnTokens.l;
  return { ...idnTokens, ...n, dark };
}

export function useIdnTheme(): IdnTheme {
  const scheme = useColorScheme();
  return idnTheme(scheme === 'dark');
}

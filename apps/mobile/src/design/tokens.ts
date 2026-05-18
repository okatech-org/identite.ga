// IDN — Design tokens (RN port of ressources/interfaces/project/idn-tokens.jsx)
// Sober institutional aesthetic. Green primary, yellow + blue as accents.

export const idnTokens = {
  green: '#0E7C3A',
  greenDk: '#0A5C2C',
  greenSoft: '#E6F2EA',
  yellow: '#F2C811',
  yellowSoft: '#FCF4D6',
  blue: '#2563AC',
  blueSoft: '#E6EEF7',
  danger: '#B83A3A',

  l: {
    bg: '#FAFAF8',
    surface: '#FFFFFF',
    surface2: '#F4F3EE',
    border: '#E6E4DD',
    borderSoft: '#EFEEE9',
    ink: '#16170F',
    ink2: '#3A3D2E',
    muted: '#74766B',
    mutedSoft: '#A6A89D',
  } as IdnNeutrals,
  d: {
    bg: '#0E110D',
    surface: '#181C16',
    surface2: '#22271F',
    border: '#2C3128',
    borderSoft: '#232820',
    ink: '#F2F0E8',
    ink2: '#D4D2C7',
    muted: '#9A9C8E',
    mutedSoft: '#6B6D62',
  } as IdnNeutrals,

  font: undefined as string | undefined,
  mono: 'Menlo' as string,

  radius: { sm: 6, md: 10, lg: 14, xl: 20, pill: 9999 },
};

export type IdnNeutrals = {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  borderSoft: string;
  ink: string;
  ink2: string;
  muted: string;
  mutedSoft: string;
};
export type IdnTheme = typeof idnTokens & IdnNeutrals & { dark: boolean };

import { useColorScheme } from 'react-native';

export const fonts = {
  regular: 'Nunito_400Regular',
  semi: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extra: 'Nunito_800ExtraBold',
};

const dark = {
  mode: 'dark',
  bg: '#031026',
  surface: '#0b2146',
  surface2: '#102a56',
  border: '#17356b',
  text: '#ffffff',
  muted: '#9db8e0',
  primary: '#5ca4ff',
  onPrimary: '#031026',
  chipBg: '#17356b',
  chipText: '#a9ccff',
  heroFrom: '#5ca4ff',
  heroTo: '#8cbfff',
  heroText: '#031026',
  danger: '#ff8a8a',
};

const light = {
  mode: 'light',
  bg: '#f2f7fe',
  surface: '#ffffff',
  surface2: '#e6f0fb',
  border: '#cfe0f5',
  text: '#0b2f63',
  muted: '#52709c',
  primary: '#1d6fd8',
  onPrimary: '#ffffff',
  chipBg: '#dbeafe',
  chipText: '#0b4fa8',
  heroFrom: '#1d6fd8',
  heroTo: '#0b4fa8',
  heroText: '#ffffff',
  danger: '#c62828',
};

// Tema automático conforme a preferência do aparelho
export const useTheme = () => (useColorScheme() === 'light' ? light : dark);
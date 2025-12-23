/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Inter Tight font family (using Inter as base with tighter letter spacing)
export const Fonts = {
  default: 'InterTight-Regular',
  regular: 'InterTight-Regular',
  medium: 'InterTight-Medium',
  semiBold: 'InterTight-SemiBold',
  bold: 'InterTight-Bold',
  // Fallback to system fonts if Inter Tight is not loaded
  fallback: Platform.select({
    ios: 'system-ui',
    android: 'sans-serif',
    web: "'Inter Tight', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    default: 'sans-serif',
  }),
};

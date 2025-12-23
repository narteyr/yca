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

// Inter font family - high-legibility neutral sans serif
export const Fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extraBold: 'Inter-ExtraBold',
  // Fallback to system fonts if Inter is not loaded
  fallback: Platform.select({
    ios: 'system-ui',
    android: 'sans-serif',
    web: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    default: 'sans-serif',
  }),
};

// Typography scale - comprehensive type system
export const Typography = {
  // Display - for large, impactful headlines
  display: {
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1,
    fontFamily: Fonts.extraBold,
  },
  // Headings
  h1: {
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.5,
    fontFamily: Fonts.extraBold,
  },
  h2: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.25,
    fontFamily: Fonts.bold,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
    fontFamily: Fonts.bold,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 0,
    fontFamily: Fonts.semiBold,
  },
  h5: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
    fontFamily: Fonts.semiBold,
  },
  h6: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    fontFamily: Fonts.semiBold,
  },
  // Body text
  body: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    fontFamily: Fonts.regular,
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    fontFamily: Fonts.medium,
  },
  bodySemiBold: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    fontFamily: Fonts.semiBold,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    fontFamily: Fonts.regular,
  },
  bodySmallMedium: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    fontFamily: Fonts.medium,
  },
  // UI elements
  button: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.25,
    fontFamily: Fonts.semiBold,
  },
  buttonSmall: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
    fontFamily: Fonts.semiBold,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    fontFamily: Fonts.regular,
  },
  captionMedium: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    fontFamily: Fonts.medium,
  },
  overline: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase' as const,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    fontFamily: Fonts.medium,
  },
};

import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Typography } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | 'display'
    | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    | 'body' | 'bodyMedium' | 'bodySemiBold' | 'bodySmall' | 'bodySmallMedium'
    | 'button' | 'buttonSmall'
    | 'caption' | 'captionMedium'
    | 'overline' | 'label'
    | 'link'
    // Backwards compatibility
    | 'default' | 'title' | 'defaultSemiBold' | 'subtitle';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'body',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  // Map old types to new typography system for backwards compatibility
  const mappedType =
    type === 'default' ? 'body' :
    type === 'defaultSemiBold' ? 'bodySemiBold' :
    type === 'title' ? 'h2' :
    type === 'subtitle' ? 'h4' :
    type;

  return (
    <Text
      style={[
        { color },
        mappedType === 'link' ? styles.link : Typography[mappedType as keyof typeof Typography],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  link: {
    ...Typography.body,
    color: '#0a7ea4',
  },
});

import { Text, TextProps, StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

interface AppTextProps extends TextProps {
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold';
}

export function AppText({ style, weight = 'regular', ...props }: AppTextProps) {
  const fontFamily = Fonts[weight] || Fonts.default;
  
  return (
    <Text
      style={[
        { fontFamily },
        style,
      ]}
      {...props}
    />
  );
}


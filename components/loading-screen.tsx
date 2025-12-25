import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { Fonts } from '@/constants/theme';
import { colors } from '@/constants/colors';

interface LoadingScreenProps {
  message?: string;
  backgroundColor?: string;
}

export default function LoadingScreen({ 
  message = 'Loading...',
  backgroundColor = colors.softpaper 
}: LoadingScreenProps) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: colors.textSecondary,
  },
});


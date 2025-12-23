import { useFonts } from 'expo-font';

export function useAppFonts() {
  const [fontsLoaded, fontError] = useFonts({
    // Inter Tight font family
    'InterTight-Regular': require('@/assets/fonts/InterTight-Regular.ttf'),
    'InterTight-Medium': require('@/assets/fonts/InterTight-Medium.ttf'),
    'InterTight-SemiBold': require('@/assets/fonts/InterTight-SemiBold.ttf'),
    'InterTight-Bold': require('@/assets/fonts/InterTight-Bold.ttf'),
  });

  return { fontsLoaded, fontError };
}


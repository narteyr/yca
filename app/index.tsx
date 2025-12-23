import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

export default function LaunchScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          clearInterval(interval);
          // Navigate to onboarding after loading
          setTimeout(() => {
            router.replace('/onboarding');
          }, 500);
          return 1;
        }
        return prev + 0.1;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      {/* Title */}
      <Text style={styles.title}>YC Internships</Text>

      {/* Slogan */}
      <Text style={styles.slogan}>BUILD THE FUTURE</Text>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Description */}
      <Text style={styles.description}>Curated roles at Y Combinator companies</Text>

      {/* Version */}
      <Text style={styles.version}>v1.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  slogan: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 1,
    marginBottom: 40,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    marginBottom: 40,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  description: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  version: {
    fontSize: 12,
    color: '#000000',
    position: 'absolute',
    bottom: 40,
  },
});


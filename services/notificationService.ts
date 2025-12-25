import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db } from '@/config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Setup notification listeners for handling notification taps
 * This enables deep linking to job details when a notification is tapped
 */
export function setupNotificationListeners() {
  // Handle notification tap when app is in foreground or background
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;

    console.log('Notification tapped:', data);

    // Handle different notification types
    if (data.type === 'new_job' && data.jobId) {
      console.log('Navigating to job details:', data.jobId);
      // Navigate to tabs first to ensure proper navigation history,
      // then push details on top so back button works correctly
      router.push('/(tabs)');
      // Small delay to ensure tabs navigation completes before pushing details
      setTimeout(() => {
        router.push(`/details?id=${data.jobId}`);
      }, 100);
    }
  });

  // Handle notification received while app is in foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received while app is in foreground:', notification);
  });

  // Return cleanup function
  return () => {
    subscription.remove();
    receivedSubscription.remove();
  };
}

/**
 * Register for push notifications and get Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return undefined;
    }

    try {
      // Get Expo push token
      // For development: This requires an Expo account and project setup
      // Run: npx expo login && eas init
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('✅ Push token obtained:', token);
    } catch (error: any) {
      console.error('❌ Error getting push token:', error);

      // Check for specific error types
      if (error.message?.includes('projectId') || error.message?.includes('VALIDATION_ERROR')) {
        console.error('');
        console.error('⚠️  Expo Project Setup Required:');
        console.error('   1. Run: npx expo login');
        console.error('   2. Run: eas init');
        console.error('   3. Restart your app');
        console.error('');
        console.error('   Or add "extra.eas.projectId" to your app.json');
        console.error('');

        // For development, you might want to use a mock token
        // Uncomment the line below if you want to test without Expo account
        // token = 'ExponentPushToken[DEVELOPMENT_MODE]';
      }

      throw error;
    }
  } else {
    console.log('⚠️  Must use physical device for Push Notifications');
    console.log('   Simulators/Emulators do not support push notifications');
  }

  return token;
}

/**
 * Save push token to user document in Firestore
 */
export async function savePushTokenToUser(userId: string, pushToken: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      pushToken,
      updatedAt: new Date(),
    });
    console.log('Push token saved to Firestore');
  } catch (error) {
    console.error('Error saving push token:', error);
    throw error;
  }
}

/**
 * Remove push token from user document in Firestore
 */
export async function removePushTokenFromUser(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      pushToken: null,
      updatedAt: new Date(),
    });
    console.log('Push token removed from Firestore');
  } catch (error) {
    console.error('Error removing push token:', error);
    throw error;
  }
}

/**
 * Enable push notifications for the current user
 */
export async function enablePushNotifications(userId: string): Promise<boolean> {
  try {
    const token = await registerForPushNotificationsAsync();
    if (!token) {
      return false;
    }

    await savePushTokenToUser(userId, token);
    await AsyncStorage.setItem('pushNotificationsEnabled', 'true');
    return true;
  } catch (error) {
    console.error('Error enabling push notifications:', error);
    return false;
  }
}

/**
 * Disable push notifications for the current user
 */
export async function disablePushNotifications(userId: string): Promise<void> {
  try {
    await removePushTokenFromUser(userId);
    await AsyncStorage.setItem('pushNotificationsEnabled', 'false');
  } catch (error) {
    console.error('Error disabling push notifications:', error);
    throw error;
  }
}

/**
 * Check if push notifications are enabled
 */
export async function arePushNotificationsEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem('pushNotificationsEnabled');
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking push notification status:', error);
    return false;
  }
}

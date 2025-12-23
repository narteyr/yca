import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/config/firebase';

interface TestNotificationResult {
  success: boolean;
  message: string;
  matchingUsers: number;
}

/**
 * Test push notifications for a specific job
 * Useful for debugging and verifying the notification system
 *
 * @param jobId - The ID of the job to test notifications for
 * @returns Result indicating success and number of users notified
 *
 * @example
 * ```typescript
 * import { testPushNotification } from '@/utils/testNotifications';
 *
 * const handleTest = async () => {
 *   try {
 *     const result = await testPushNotification('some-job-id');
 *     Alert.alert('Success', `Sent to ${result.matchingUsers} users`);
 *   } catch (error) {
 *     Alert.alert('Error', 'Failed to send test notification');
 *   }
 * };
 * ```
 */
export async function testPushNotification(jobId: string): Promise<TestNotificationResult> {
  const functions = getFunctions(app);
  const testNotification = httpsCallable<{ jobId: string }, TestNotificationResult>(
    functions,
    'testJobNotification'
  );

  try {
    const result = await testNotification({ jobId });
    console.log('Test notification result:', result.data);
    return result.data;
  } catch (error: any) {
    console.error('Test notification failed:', error);
    throw new Error(error.message || 'Failed to send test notification');
  }
}

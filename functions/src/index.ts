import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Expo SDK
const expo = new Expo();

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
  salary: string;
  job_type: string;
  remote: boolean;
  url: string;
  posted_date: string;
  via: string;
  source: string;
  sponsors_visa: boolean;
  benefits: string[];
  responsibilities: string[];
  thumbnail: string;
  scraped_at: string;
  visa?: string;
  processed?: boolean;
  created_at?: admin.firestore.Timestamp;
  updated_at?: admin.firestore.Timestamp;
  ai_summary?: string;
}

interface UserPreferences {
  preferredLocations?: string[];
  preferredSalaryRange?: {
    min?: number;
    max?: number;
  };
  remoteOnly?: boolean;
  visaSponsorshipRequired?: boolean;
  jobTypes?: string[];
  skills?: string[];
  graduationYear?: string;
  major?: string;
  studentStatus?: 'National' | 'International';
  experienceLevel?: string;
  otherRelevance?: string[];
  resumeEmbedding?: number[];
  resumeProcessed?: boolean;
  notificationsEnabled?: boolean;
}

interface User {
  id: string;
  email?: string;
  name?: string;
  preferences?: UserPreferences;
  pushToken?: string;
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

/**
 * Check if a job matches a user's preferences
 * Using MINIMAL filtering to avoid missing relevant jobs
 */
function jobMatchesUserPreferences(job: Job, preferences: UserPreferences): boolean {
  // TESTING MODE: All filters disabled to test if notifications work!
  console.log(`✓ TESTING MODE - All filters disabled, job matches: ${job.title}`);

  // Only check if notifications are explicitly disabled
  if (preferences.notificationsEnabled === false) {
    console.log('Filtered out: Notifications explicitly disabled');
    return false;
  }

  // ALL OTHER FILTERS REMOVED FOR TESTING
  return true;
}

/**
 * Send push notifications to matching users
 */
async function sendPushNotifications(
  users: User[],
  job: Job
): Promise<void> {
  const messages: ExpoPushMessage[] = [];

  for (const user of users) {
    // Skip if user doesn't have a push token
    if (!user.pushToken) {
      continue;
    }

    // Validate that the token is an Expo push token
    if (!Expo.isExpoPushToken(user.pushToken)) {
      console.error(`Invalid Expo push token for user ${user.id}: ${user.pushToken}`);
      continue;
    }

    messages.push({
      to: user.pushToken,
      sound: 'default',
      title: `New ${job.job_type} at ${job.company}`,
      body: `${job.title} - ${job.location}${job.remote ? ' (Remote)' : ''}`,
      data: {
        jobId: job.id,
        type: 'new_job',
        url: job.url,
      },
      categoryId: 'new_job',
      priority: 'high',
    });
  }

  // Chunk messages to send in batches (Expo recommends max 100 per batch)
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
      console.log(`Sent ${chunk.length} notifications`);
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  }

  // Check for any errors in the tickets
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    if (ticket.status === 'error') {
      console.error(`Error sending notification: ${ticket.message}`);

      // If the error is related to an invalid token, remove it from the user
      if (ticket.details?.error === 'DeviceNotRegistered') {
        const user = users[i];
        if (user) {
          await admin.firestore().collection('users').doc(user.id).update({
            pushToken: admin.firestore.FieldValue.delete(),
          });
          console.log(`Removed invalid push token for user ${user.id}`);
        }
      }
    }
  }
}

/**
 * Cloud Function triggered when a new job is created
 * Sends push notifications to users with matching preferences
 * RATE LIMITED: Max 1 notification per user per batch to prevent spam
 */
export const notifyUsersOfNewJob = functions.firestore
  .document('jobs/{jobId}')
  .onCreate(async (snapshot, context) => {
    const job = { id: snapshot.id, ...snapshot.data() } as Job;

    console.log(`New job created: ${job.id} - ${job.title} at ${job.company}`);

    // Only process jobs from startups
    if (job.source !== 'startup') {
      console.log(`Skipping job ${job.id} - source is not 'startup' (source: ${job.source})`);
      return null;
    }

    console.log(`Processing startup job: ${job.title} at ${job.company}`);

    try {
      // Query users who have notifications enabled and a push token
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('pushToken', '!=', null)
        .get();

      console.log(`Found ${usersSnapshot.size} users with push tokens`);

      if (usersSnapshot.empty) {
        console.log('No users with push tokens found');
        return null;
      }

      // Get current time for rate limiting
      const now = admin.firestore.Timestamp.now();

      // Filter users whose preferences match the job
      const matchingUsers: User[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const user = { id: userDoc.id, ...userDoc.data() } as User;

        // DEBUG: Log user preferences
        console.log(`User ${user.id} preferences:`, JSON.stringify({
          remoteOnly: user.preferences?.remoteOnly,
          visaSponsorshipRequired: user.preferences?.visaSponsorshipRequired,
          notificationsEnabled: user.preferences?.notificationsEnabled,
        }));

        // Check if user preferences match
        if (!user.preferences || !jobMatchesUserPreferences(job, user.preferences)) {
          continue;
        }

        // RATE LIMITING: Max 2 notifications per user with time spacing
        const notificationCount = (user as any).notificationCount || 0;
        const lastNotified = (user as any).lastNotifiedAt;

        // Check if user has reached max notifications (2)
        if (notificationCount >= 2) {
          console.log(`Rate limit: User ${user.id} has already received ${notificationCount} notifications (max 2), skipping`);
          continue;
        }

        // Check time spacing between notifications (minimum 1 hour)
        if (lastNotified) {
          const lastNotifiedDate = lastNotified.toDate();
          const hoursSinceLastNotification = (now.toDate().getTime() - lastNotifiedDate.getTime()) / (1000 * 60 * 60);

          // Require at least 1 hour between notifications
          if (hoursSinceLastNotification < 1) {
            console.log(`Rate limit: User ${user.id} was notified ${hoursSinceLastNotification.toFixed(1)} hours ago (min 1 hour spacing), skipping`);
            continue;
          }
        }

        matchingUsers.push(user);
      }

      console.log(`Found ${matchingUsers.length} users with matching preferences (after rate limiting)`);

      if (matchingUsers.length === 0) {
        console.log('No users with matching preferences found');
        return null;
      }

      // LIMIT: Only notify first user to prevent spam during testing
      // Remove this limit in production if you want to notify all matching users
      const usersToNotify = matchingUsers.slice(0, 1);
      console.log(`Limiting to ${usersToNotify.length} user(s) for this job`);

      // Send push notifications to matching users
      await sendPushNotifications(usersToNotify, job);

      // Update notification tracking for each user
      const batch = admin.firestore().batch();
      for (const user of usersToNotify) {
        const userRef = admin.firestore().collection('users').doc(user.id);
        const currentCount = (user as any).notificationCount || 0;

        batch.update(userRef, {
          lastNotifiedAt: now,
          notificationCount: currentCount + 1,
        });
      }
      await batch.commit();
      console.log('Updated notification tracking for notified users');

      console.log(`Successfully processed notifications for job ${job.id}`);
      return null;
    } catch (error) {
      console.error('Error processing job notification:', error);
      throw error;
    }
  });

/**
 * Test function to manually trigger a notification (useful for testing)
 * Call this function with a jobId to test notifications
 */
export const testJobNotification = functions.https.onCall(async (data, context) => {
  // Verify the request is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { jobId } = data;

  if (!jobId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Job ID is required'
    );
  }

  try {
    const jobDoc = await admin.firestore().collection('jobs').doc(jobId).get();

    if (!jobDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Job not found'
      );
    }

    const job = { id: jobDoc.id, ...jobDoc.data() } as Job;

    // Query users who have notifications enabled and a push token
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('pushToken', '!=', null)
      .get();

    const matchingUsers: User[] = [];

    for (const userDoc of usersSnapshot.docs) {
      const user = { id: userDoc.id, ...userDoc.data() } as User;

      if (user.preferences && jobMatchesUserPreferences(job, user.preferences)) {
        matchingUsers.push(user);
      }
    }

    await sendPushNotifications(matchingUsers, job);

    return {
      success: true,
      message: `Sent notifications to ${matchingUsers.length} users`,
      matchingUsers: matchingUsers.length,
    };
  } catch (error) {
    console.error('Error in test notification:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error sending test notification'
    );
  }
});

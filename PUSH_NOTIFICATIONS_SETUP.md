# Push Notifications Setup Guide

This guide will help you set up and deploy push notifications for your YCA app.

## Overview

The push notification system consists of:

1. **Client-side** (React Native):
   - Push token registration
   - Notification permissions handling
   - Toggle in profile settings

2. **Server-side** (Firebase Cloud Functions):
   - Automatic job matching
   - Push notification delivery via Expo
   - Token management and cleanup

## Prerequisites

- Firebase project set up
- Expo account (free tier works)
- Node.js 18+ installed
- Firebase CLI installed globally

## Step 1: Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase

```bash
firebase login
```

## Step 3: Link Your Firebase Project

```bash
# View your Firebase projects
firebase projects:list

# Use your project
firebase use <your-project-id>

# Or create alias
firebase use --add
```

## Step 4: Install Cloud Functions Dependencies

```bash
cd functions
npm install
cd ..
```

## Step 5: Build the Functions

```bash
cd functions
npm run build
cd ..
```

## Step 6: Set Up Firestore Indexes

The push notification query requires a composite index. Create `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "pushToken",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "preferences.notificationsEnabled",
          "order": "ASCENDING"
        }
      ]
    }
  ]
}
```

## Step 7: Deploy to Firebase

### Deploy everything:

```bash
firebase deploy
```

### Or deploy only functions:

```bash
firebase deploy --only functions
```

### First deployment might take 5-10 minutes

The first time you deploy, Firebase will:
- Build your TypeScript code
- Upload the functions
- Create the necessary infrastructure
- Set up triggers

## Step 8: Verify Deployment

1. Open Firebase Console: https://console.firebase.google.com
2. Go to your project
3. Navigate to **Functions**
4. You should see two functions:
   - `notifyUsersOfNewJob` (Firestore trigger)
   - `testJobNotification` (HTTPS callable)

## Step 9: Test the Notification System

### Option A: Add a Test Job

1. Go to Firestore in Firebase Console
2. Add a new document to the `jobs` collection with:
   ```json
   {
     "source": "startup",
     "title": "Software Engineer Intern",
     "company": "Test Startup",
     "location": "San Francisco, CA",
     "job_type": "Internship",
     "remote": true,
     "sponsors_visa": false,
     "url": "https://example.com",
     "posted_date": "2025-01-01",
     "via": "test",
     "benefits": [],
     "responsibilities": [],
     "description": "Test job",
     "requirements": "Test requirements",
     "salary": "$50-60k",
     "thumbnail": ""
   }
   ```

3. Users with matching preferences should receive notifications

### Option B: Use the Test Function

Create a test script in your React Native app:

```typescript
// utils/testNotifications.ts
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/config/firebase';

export async function testPushNotification(jobId: string) {
  const functions = getFunctions(app);
  const testNotification = httpsCallable(functions, 'testJobNotification');

  try {
    const result = await testNotification({ jobId });
    console.log('Test result:', result.data);
    return result.data;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}
```

Then use it in a component:

```typescript
import { testPushNotification } from '@/utils/testNotifications';

// In your component
const handleTestNotification = async () => {
  try {
    const result = await testPushNotification('some-existing-job-id');
    Alert.alert('Success', `Sent to ${result.matchingUsers} users`);
  } catch (error) {
    Alert.alert('Error', 'Failed to send test notification');
  }
};
```

## How It Works

### User Flow

1. User goes to Profile → Settings
2. Toggles "Push Notifications" on
3. App requests notification permissions
4. App gets Expo push token
5. Token is saved to user's Firestore document

### Notification Flow

1. New job is added to Firestore with `source: 'startup'`
2. Cloud Function `notifyUsersOfNewJob` is triggered
3. Function queries users with:
   - Valid push tokens
   - Notifications enabled
   - Matching preferences
4. Function sends push notifications via Expo
5. Users receive notifications on their devices

### Preference Matching

The function matches jobs to users based on:

- **Remote Preference**: If user set `remoteOnly: true`, only remote jobs match
- **Visa Sponsorship**: If user set `visaSponsorshipRequired: true`, only jobs with visa sponsorship match
- **Preferred Locations**: Job location must match one of the user's preferred locations
- **Job Types**: Job type must match one of the user's preferred job types

## Monitoring

### View Logs

```bash
firebase functions:log
```

### Or in Firebase Console

1. Go to Functions in Firebase Console
2. Click on a function name
3. View the "Logs" tab

### Common Log Messages

- `New job created: {id}` - Job creation detected
- `Skipping job {id} - source is not 'startup'` - Job filtered out
- `Found X users with push tokens` - Users queried
- `Found X users with matching preferences` - Users matched
- `Sent X notifications` - Notifications sent

## Troubleshooting

### No notifications received

1. **Check user preferences**:
   - User has `notificationsEnabled: true` (or undefined)
   - User has a valid `pushToken`

2. **Check job source**:
   - Job must have `source: 'startup'` exactly (case-sensitive)

3. **Check matching**:
   - User preferences must match job criteria
   - View function logs to see how many users matched

4. **Check permissions**:
   - User granted notification permissions on device
   - Check device settings

### Function errors

1. **Check function logs**:
   ```bash
   firebase functions:log
   ```

2. **Common errors**:
   - Invalid Expo push token (automatically cleaned up)
   - Firestore permission issues (check security rules)
   - Missing indexes (deploy firestore.indexes.json)

### Token issues

If tokens become invalid, the function automatically removes them from user documents. The user will need to toggle notifications off and on again to get a new token.

## Security Rules

Update your `firestore.rules` to allow Cloud Functions to update tokens:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Allow Cloud Functions to update push tokens
      allow update: if request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['pushToken', 'updatedAt']);
    }

    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Adjust based on your needs
    }
  }
}
```

## Cost Considerations

- **Cloud Functions**: Free tier includes 125K invocations/month
- **Firestore**: Free tier includes 50K reads/day
- **Expo Push Notifications**: Free and unlimited

For most apps, this will stay within free tiers. Monitor usage in Firebase Console.

## Production Checklist

- [ ] Functions deployed successfully
- [ ] Firestore indexes created
- [ ] Security rules updated
- [ ] Test notifications working
- [ ] Logs show successful execution
- [ ] Invalid tokens are being cleaned up
- [ ] Users can toggle notifications on/off
- [ ] Notification permissions requested properly

## Support

If you encounter issues:

1. Check function logs: `firebase functions:log`
2. Check Firestore data (ensure users have pushToken field)
3. Check device notification permissions
4. Verify job has `source: 'startup'`
5. Test with the `testJobNotification` function

## Next Steps

After setup is complete:

1. Test with real job postings
2. Monitor logs for the first few days
3. Adjust preference matching logic if needed
4. Consider adding notification categories
5. Add analytics to track notification engagement

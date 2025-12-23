# Firebase Cloud Functions for Push Notifications

This directory contains the Firebase Cloud Functions that handle push notifications for new job postings.

## Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Initialize Firebase (if not already done)

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already initialized)
firebase init
```

### 3. Set Firebase Project

```bash
# List your Firebase projects
firebase projects:list

# Use your project
firebase use <your-project-id>
```

## Functions

### `notifyUsersOfNewJob`

**Trigger**: Firestore onCreate trigger for `jobs/{jobId}` documents

**Purpose**: Automatically sends push notifications to users when a new startup job is added.

**How it works**:
1. Triggers when a new job document is created in Firestore
2. Checks if `job.source === 'startup'`
3. Queries all users who have:
   - Push notifications enabled (`notificationsEnabled !== false`)
   - A valid push token (`pushToken !== null`)
4. Filters users based on their preferences:
   - Remote preference (`remoteOnly`)
   - Visa sponsorship requirement (`visaSponsorshipRequired`)
   - Preferred locations (`preferredLocations`)
   - Job types (`jobTypes`)
5. Sends push notifications via Expo Push Notification service
6. Handles invalid tokens by removing them from user documents

### `testJobNotification`

**Trigger**: HTTPS callable function

**Purpose**: Test push notifications for an existing job (useful for debugging)

**Usage**:
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const testNotification = httpsCallable(functions, 'testJobNotification');

const result = await testNotification({ jobId: 'some-job-id' });
console.log(result.data);
```

## Development

### Build TypeScript

```bash
npm run build
```

### Watch mode (auto-rebuild on changes)

```bash
npm run build:watch
```

### Run locally with emulators

```bash
npm run serve
```

## Deployment

### Deploy all functions

```bash
npm run deploy
```

### Deploy from project root

```bash
cd ..
firebase deploy --only functions
```

### Deploy a specific function

```bash
firebase deploy --only functions:notifyUsersOfNewJob
```

## Logs

### View function logs

```bash
npm run logs

# Or view specific function logs
firebase functions:log --only notifyUsersOfNewJob
```

## Testing

### Test with a real job

1. Add a new job document to Firestore with `source: 'startup'`
2. Check the Firebase Functions logs
3. Users with matching preferences should receive notifications

### Test with the test function

```typescript
// In your React Native app
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const testNotification = httpsCallable(functions, 'testJobNotification');

try {
  const result = await testNotification({ jobId: 'existing-job-id' });
  console.log('Test result:', result.data);
  Alert.alert('Success', `Sent to ${result.data.matchingUsers} users`);
} catch (error) {
  console.error('Test failed:', error);
  Alert.alert('Error', 'Test notification failed');
}
```

## Monitoring

- **Firebase Console**: https://console.firebase.google.com
- Navigate to Functions → Logs to see execution logs
- Navigate to Functions → Usage to see metrics

## Common Issues

### Invalid Expo Push Token

If you see errors about invalid tokens, the function automatically removes them from user documents.

### No notifications sent

Check:
1. Users have `notificationsEnabled` set to `true` (or not set, as it defaults to true)
2. Users have a valid `pushToken` in their user document
3. Job `source` is exactly `'startup'` (case-sensitive)
4. User preferences match the job criteria

### Function timeout

If processing many users, you may need to increase the timeout:

```typescript
export const notifyUsersOfNewJob = functions
  .runWith({ timeoutSeconds: 300 }) // 5 minutes
  .firestore
  .document('jobs/{jobId}')
  .onCreate(async (snapshot, context) => {
    // ...
  });
```

## Security Considerations

- Only authenticated users can call the test function
- The onCreate trigger runs automatically and doesn't require authentication
- Invalid push tokens are automatically cleaned up
- User push tokens are stored securely in Firestore

## Cost Optimization

- The function only queries users with push tokens (indexed query)
- Notifications are sent in batches (max 100 per batch as per Expo recommendations)
- Invalid tokens are removed to prevent wasted notifications

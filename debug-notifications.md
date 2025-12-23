# Debug Push Notifications Checklist

## Issue: Not receiving notifications when jobs are added

Let's go through each potential issue:

---

## ✅ Step 1: Verify Job Has Correct Source

**CRITICAL**: The cloud function ONLY triggers for jobs where `source === 'startup'`

Check your job document in Firestore:

1. Go to Firebase Console → Firestore
2. Find the job you just added
3. **Check that it has**: `source: "startup"` (exactly, case-sensitive)

❌ **Will NOT work:**
- `source: "Startup"` (capital S)
- `source: "startups"`
- `source: "yc"`
- Missing source field

✅ **Will work:**
- `source: "startup"` (lowercase)

---

## ✅ Step 2: Check Function Logs

View the Cloud Function logs to see if it's triggering:

```bash
firebase functions:log --limit 100
```

**What to look for:**

✅ Good signs:
- `New job created: [id] - [title] at [company]`
- `Processing startup job: [title]`
- `Found X users with push tokens`
- `Found X users with matching preferences`
- `Sent X notifications`

❌ Bad signs:
- `Skipping job [id] - source is not 'startup'`
- No logs at all (function not triggering)
- Error messages

---

## ✅ Step 3: Verify Function is Deployed

Check that the function exists in Firebase:

```bash
firebase functions:list
```

You should see:
- `notifyUsersOfNewJob(us-central1)`
- `testJobNotification(us-central1)`

If not listed, redeploy:
```bash
firebase deploy --only functions
```

---

## ✅ Step 4: Check Your User Document

Your user document must have:

1. **Push Token**:
   - Field: `pushToken`
   - Value: Something like `ExponentPushToken[xxxxxx]`

2. **Notifications Enabled**:
   - Field: `preferences.notificationsEnabled`
   - Value: `true` (or undefined/not set)

3. **Matching Preferences**:
   - If job is remote-only and you set `remoteOnly: true`, job must have `remote: true`
   - If you set `visaSponsorshipRequired: true`, job must have `sponsors_visa: true`
   - If you set preferred locations, job location must match

**View your user document:**
1. Go to Firebase Console → Firestore
2. Collection: `users`
3. Document: Your user ID
4. Check fields above

---

## ✅ Step 5: Test with Manual Trigger

Use the test function to verify everything works:

Create a file `test-notification.ts` in your project:

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './config/firebase';

const functions = getFunctions(app);
const testNotification = httpsCallable(functions, 'testJobNotification');

// Replace with an actual job ID from Firestore
const jobId = 'YOUR_JOB_ID_HERE';

testNotification({ jobId })
  .then((result) => {
    console.log('✅ Test result:', result.data);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
  });
```

Or test via Firebase Console:
1. Go to Functions → testJobNotification
2. Click "Run Function"
3. Enter: `{"jobId": "your-job-id"}`

---

## ✅ Step 6: Check Firestore Rules

Your Firestore rules must allow the Cloud Function to read users and jobs.

Check `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true; // Cloud Functions need read access
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /jobs/{jobId} {
      allow read: if true; // Cloud Functions need read access
      allow write: if request.auth != null;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

## ✅ Step 7: Common Issues

### Issue: "Found 0 users with push tokens"
**Solution**: Make sure your user document has a `pushToken` field

### Issue: "Found 0 users with matching preferences"
**Solution**:
- Remove all preference filters temporarily
- Or make sure the job matches your preferences

### Issue: No logs showing up
**Solution**:
- Function didn't trigger
- Check that you added to the `jobs` collection (not `Jobs` or `job`)
- Make sure `source: "startup"` is set

### Issue: Function triggers but no notification
**Solution**:
- Check the Expo push token is valid
- Try toggling notifications off and back on to get a new token
- Make sure you're on a physical device

---

## 🔍 Quick Debug Commands

```bash
# View recent function logs
firebase functions:log --limit 50

# List all functions
firebase functions:list

# Check Firestore rules
cat firestore.rules

# Redeploy everything
firebase deploy
```

---

## 📱 Final Checklist

Before expecting a notification, verify:

- [ ] Job has `source: "startup"` (lowercase)
- [ ] Job is in `jobs` collection
- [ ] Your user has valid `pushToken` in Firestore
- [ ] `notificationsEnabled` is not `false`
- [ ] Using physical device (not simulator)
- [ ] Cloud function is deployed
- [ ] Function logs show job was processed
- [ ] Notification permissions are granted on device

---

## 🆘 Still Not Working?

Share these details:

1. **Function logs** (last 20 lines):
   ```bash
   firebase functions:log --limit 20
   ```

2. **Job document structure** (sanitized):
   ```
   {
     "source": "?",
     "title": "?",
     ...
   }
   ```

3. **User document** (sanitized):
   ```
   {
     "pushToken": "ExponentPushToken[...]?",
     "preferences": { ... }
   }
   ```

4. **Error messages** from app console

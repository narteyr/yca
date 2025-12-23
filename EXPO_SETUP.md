# Expo Push Notifications Setup

You're seeing a validation error because push notifications require an Expo account and project setup.

## Quick Setup (5 minutes)

### Step 1: Create Expo Account

If you don't have an Expo account:
1. Go to https://expo.dev/signup
2. Sign up for free
3. Verify your email

### Step 2: Login to Expo CLI

```bash
npx expo login
```

Enter your Expo username and password when prompted.

### Step 3: Initialize EAS Project

```bash
eas init
```

This will:
- Create an Expo project
- Add a `projectId` to your `app.json`
- Set up your project for push notifications

**Follow the prompts:**
- Choose your Expo account
- Confirm the project name ("yca")

### Step 4: Verify Setup

Check your `app.json` - you should see:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

### Step 5: Restart Your App

```bash
# Stop your current dev server (Ctrl+C)
npm start
```

### Step 6: Test Push Notifications

1. Open your app on a **physical device** (not simulator)
2. Go to Profile → Settings
3. Toggle "Push Notifications" ON
4. You should now successfully get a push token! ✅

## Troubleshooting

### "Must use physical device"
- Push notifications don't work on iOS Simulator or Android Emulator
- Use a real device connected via USB or over network

### "Permission denied"
- Make sure you granted notification permissions when prompted
- On iOS: Settings → YCA → Notifications → Allow
- On Android: Settings → Apps → YCA → Notifications → Enable

### Still getting errors?
- Make sure you're logged in: `npx expo whoami`
- Try logging out and back in: `npx expo logout` then `npx expo login`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Alternative: Development Mode (Testing Only)

If you want to test the UI without setting up Expo account:

1. Open `services/notificationService.ts`
2. Find line 68 with the mock token comment
3. Uncomment it:
   ```typescript
   token = 'ExponentPushToken[DEVELOPMENT_MODE]';
   ```

⚠️ **Note**: This won't send real notifications, just allows UI testing.

## Production Deployment

When you're ready to publish your app:

1. Build your app:
   ```bash
   eas build --platform android
   # or
   eas build --platform ios
   ```

2. Submit to stores:
   ```bash
   eas submit --platform android
   # or
   eas submit --platform ios
   ```

## More Info

- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [EAS Documentation](https://docs.expo.dev/eas/)
- [Expo Account Dashboard](https://expo.dev/accounts/[your-username])

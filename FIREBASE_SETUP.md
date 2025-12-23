# Firebase Setup Instructions

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## 2. Get Your Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click the **Web** icon (`</>`) to add a web app
4. Register your app (you can name it "YC Internships")
5. Copy the Firebase configuration object

## 3. Set Up Environment Variables

Create a `.env` file in the root of your project with the following:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Replace the values with your actual Firebase configuration.

## 4. Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Start in **test mode** (for development) or **production mode** (with security rules)
4. Choose a location for your database

## 5. Create the Jobs Collection

Your `jobs` collection should have documents with the following structure:

```javascript
{
  title: "Software Engineering Intern",
  company: "Stripe",
  location: "San Francisco",
  description: "Software Engineering Intern at Stripe",
  requirements: "",
  salary: "",
  job_type: "Internship", // Must be "Internship" to appear in app
  remote: false,
  url: "https://...",
  posted_date: "",
  via: "YC Work at a Startup",
  source: "startup", // Must be "startup" to appear in app
  sponsors_visa: true,
  benefits: [],
  responsibilities: [],
  thumbnail: "",
  scraped_at: "2025-12-22T14:30:00",
  id: "md5-hash",
  visa: "",
  processed: false,
  created_at: Timestamp, // Firestore timestamp
  updated_at: Timestamp  // Firestore timestamp
}
```

**Important:** The app only displays jobs where:
- `source == 'startup'`
- `job_type == 'Internship'`

## 6. Create Firestore Composite Index

The app queries jobs with multiple filters and ordering, which requires a composite index. When you first run the app, Firestore will show an error with a direct link to create the required index. Click the link to automatically create it.

Alternatively, you can create it manually:
1. Go to Firestore Database → Indexes
2. Click "Create Index"
3. Collection ID: `jobs`
4. Fields to index:
   - `source` (Ascending)
   - `job_type` (Ascending)
   - `created_at` (Descending)
5. Click "Create"

## 7. Security Rules (Optional but Recommended)

In Firestore, go to **Rules** and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{document=**} {
      allow read: if true; // Allow anyone to read jobs
      allow write: if false; // Only allow writes from admin/backend
    }
  }
}
```

## Required Firebase Config Values

You need these 6 values from your Firebase project:

- **apiKey**: Your Firebase API key
- **authDomain**: Usually `your-project-id.firebaseapp.com`
- **projectId**: Your Firebase project ID
- **storageBucket**: Usually `your-project-id.appspot.com`
- **messagingSenderId**: Your messaging sender ID
- **appId**: Your Firebase app ID

All of these can be found in your Firebase project settings under the web app configuration.

## 8. Google Sign-In Setup (Optional)

To enable Google Sign-In authentication, you need to get the Google Web Client ID:

### Method 1: From Google Cloud Console (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're in the correct project (internaly-io)
3. Navigate to **APIs & Services** → **Credentials**
4. Look for **OAuth 2.0 Client IDs** section
5. Find the one labeled **"Web client"** or **"Web application"**
6. Click on it to view details
7. Copy the **Client ID** (it looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

**Note:** If you don't see a Web client, you may need to:
- Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
- Select **"Web application"** as the application type
- Give it a name (e.g., "YC Internships Web")
- Click **"Create"**
- Copy the Client ID that appears

### Method 2: From Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (internaly-io)
3. Go to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. You'll see a link to **"Web SDK configuration"** which may show the Client ID
6. Or click the link to go to Google Cloud Console to find it

**Important:** The Google OAuth Client ID is different from:
- ❌ Firebase App ID: `1:1034550953533:web:e45545b94cea5765040c54` (this is NOT it)
- ✅ Google OAuth Client ID: `123456789-abc...apps.googleusercontent.com` (this is what you need)

### Enable Google Sign-In in Firebase
1. Firebase Console → **Authentication** → **Sign-in method**
2. Click on **Google** provider
3. Enable it and add your project's support email
4. Save

### Add to .env file
Add the Web Client ID to your `.env` file:
```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id-here.apps.googleusercontent.com
```

**Note:** The Web Client ID is different from the iOS/Android Client IDs. Make sure you're copying the **Web** client ID.

## Additional Notes

- Make sure your Firestore security rules allow authenticated users to read/write their own data
- The app uses composite indexes for efficient querying - create them when prompted
- Match scores are calculated based on user preferences from the onboarding survey (graduation year, major, skills, location preferences, etc.)


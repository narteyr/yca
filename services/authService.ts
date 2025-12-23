import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { User as UserType } from '@/types/user';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

export const signUpWithEmail = async (
  email: string,
  password: string,
  name?: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    if (user) {
      try {
        const userData: Partial<UserType> = {
          id: user.uid,
          email: user.email || email,
          name: name || user.displayName || '',
          preferences: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await setDoc(doc(db, 'users', user.uid), {
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (firestoreError) {
        // Log Firestore error but don't fail sign up
        console.error('Error creating user document:', firestoreError);
      }
    }

    return user;
  } catch (error: any) {
    // Re-throw with original error code for proper handling
    // Don't log expected Firebase auth errors - they're handled in UI
    if (error.code && error.code.startsWith('auth/')) {
      throw error;
    }
    console.error('Unexpected error signing up:', error);
    throw error;
  }
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    // Re-throw with original error code for proper handling
    // Don't log expected Firebase auth errors - they're handled in UI
    if (error.code && error.code.startsWith('auth/')) {
      throw error;
    }
    console.error('Unexpected error signing in:', error);
    throw error;
  }
};

export const signInWithGoogle = async (): Promise<User> => {
  try {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!clientId || clientId.trim() === '') {
      const error: any = new Error('Google Sign-In is not configured. Please add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env file.');
      error.code = 'GOOGLE_NOT_CONFIGURED';
      throw error;
    }

    // Create auth request
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
      redirectUri: AuthSession.makeRedirectUri({
        useProxy: true,
      }),
    });

    // Get discovery document
    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
    };

    // Start auth session
    const result = await request.promptAsync(discovery, {
      useProxy: true,
    });

    if (result.type === 'success' && result.params?.id_token) {
      const idToken = result.params.id_token as string;
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);
      const user = userCredential.user;

      // Check if user document exists, create if not
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists() && user) {
        const userData: Partial<UserType> = {
          id: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          preferences: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await setDoc(userDocRef, {
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return user;
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      const cancelledError: any = new Error('Sign in cancelled');
      cancelledError.code = 'SIGN_IN_CANCELLED';
      throw cancelledError;
    }
    
    throw new Error('Google sign-in failed');
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    if (error.code === 'SIGN_IN_CANCELLED') {
      throw error;
    }
    throw error;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};


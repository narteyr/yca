import { db } from '@/config/firebase';
import { User, UserPreferences } from '@/types/user';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';

import AsyncStorage from '@react-native-async-storage/async-storage';

const getUserId = async (): Promise<string> => {
  const userId = await AsyncStorage.getItem('userId');
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
};

export const getUser = async (): Promise<User | null> => {
  try {
    const userId = await getUserId();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create default user
      const newUser: User = {
        id: userId,
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(userRef, {
        ...newUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return newUser;
    }
    
    const data = userSnap.data();
    return {
      id: userSnap.id,
      email: data.email,
      name: data.name,
      preferences: data.preferences || {},
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };
  } catch (error: any) {
    // If user is not authenticated, return null gracefully
    if (error.message === 'User not authenticated') {
      return null;
    }
    console.error('Error fetching user:', error);
    return null;
  }
};

export const updateUserPreferences = async (preferences: Partial<UserPreferences>): Promise<void> => {
  try {
    const userId = await getUserId();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    // Remove undefined values - Firestore doesn't allow undefined
    const cleanPreferences: any = {};
    Object.keys(preferences).forEach(key => {
      const value = preferences[key as keyof UserPreferences];
      if (value !== undefined) {
        cleanPreferences[key] = value;
      }
    });
    
    if (userSnap.exists()) {
      const currentData = userSnap.data();
      // Also clean current preferences to remove any undefined values
      const cleanCurrentPreferences: any = {};
      if (currentData.preferences) {
        Object.keys(currentData.preferences).forEach(key => {
          const value = currentData.preferences[key];
          if (value !== undefined) {
            cleanCurrentPreferences[key] = value;
          }
        });
      }
      
      await updateDoc(userRef, {
        preferences: {
          ...cleanCurrentPreferences,
          ...cleanPreferences,
        },
        updatedAt: new Date(),
      });
    } else {
      await setDoc(userRef, {
        id: userId,
        preferences: cleanPreferences,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  } catch (error: any) {
    // If user is not authenticated, log but don't throw
    if (error.message === 'User not authenticated') {
      console.warn('Cannot update preferences: User not authenticated');
      return;
    }
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

export const getUserStats = async () => {
  try {
    const userId = await getUserId();
    
    // Get saved jobs count
    const savedJobsQuery = query(
      collection(db, 'saved_jobs'),
      where('userId', '==', userId)
    );
    const savedJobsSnapshot = await getDocs(savedJobsQuery);
    const savedCount = savedJobsSnapshot.size;
    
    // Get applications count
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('userId', '==', userId)
    );
    const applicationsSnapshot = await getDocs(applicationsQuery);
    const appliedCount = applicationsSnapshot.size;
    
    return {
      savedJobs: savedCount,
      applications: appliedCount,
    };
  } catch (error: any) {
    // If user is not authenticated, return default values
    if (error.message === 'User not authenticated') {
      return {
        savedJobs: 0,
        applications: 0,
      };
    }
    console.error('Error fetching user stats:', error);
    return {
      savedJobs: 0,
      applications: 0,
    };
  }
};


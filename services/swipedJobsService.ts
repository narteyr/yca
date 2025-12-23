import { db } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const getUserId = async (): Promise<string | null> => {
  const userId = await AsyncStorage.getItem('userId');
  return userId;
};

const STORAGE_KEY_SEEN_JOBS = 'seenJobIds';
const STORAGE_KEY_LAST_RESET = 'lastResetDate';

// Get today's date as YYYY-MM-DD (in user's local timezone)
const getTodayDate = (): string => {
  const today = new Date();
  // Use local timezone to ensure consistency with user's day
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

// Get timestamp of last reset (for more precise tracking)
const getLastResetTimestamp = async (): Promise<number | null> => {
  try {
    const timestamp = await AsyncStorage.getItem(`${STORAGE_KEY_LAST_RESET}_timestamp`);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error('Error getting reset timestamp:', error);
    return null;
  }
};

// Check if we should reset seen jobs (new day)
// This checks both date and ensures at least 24 hours have passed
const shouldResetSeenJobs = async (): Promise<boolean> => {
  try {
    const lastReset = await AsyncStorage.getItem(STORAGE_KEY_LAST_RESET);
    const lastResetTimestamp = await getLastResetTimestamp();
    const today = getTodayDate();
    const now = Date.now();
    
    // Check if date changed (new day)
    if (!lastReset || lastReset !== today) {
      await AsyncStorage.setItem(STORAGE_KEY_LAST_RESET, today);
      await AsyncStorage.setItem(`${STORAGE_KEY_LAST_RESET}_timestamp`, now.toString());
      return true;
    }
    
    // Also check if 24 hours have passed (in case user travels across timezones)
    // This ensures at least 24 hours between resets
    if (lastResetTimestamp) {
      const hoursSinceReset = (now - lastResetTimestamp) / (1000 * 60 * 60);
      if (hoursSinceReset >= 24) {
        await AsyncStorage.setItem(STORAGE_KEY_LAST_RESET, today);
        await AsyncStorage.setItem(`${STORAGE_KEY_LAST_RESET}_timestamp`, now.toString());
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking reset date:', error);
    return false;
  }
};

// Get seen job IDs from AsyncStorage (for unauthenticated users or as fallback)
const getSeenJobIdsFromStorage = async (): Promise<string[]> => {
  try {
    const seenJobsJson = await AsyncStorage.getItem(STORAGE_KEY_SEEN_JOBS);
    if (seenJobsJson) {
      return JSON.parse(seenJobsJson);
    }
    return [];
  } catch (error) {
    console.error('Error getting seen jobs from storage:', error);
    return [];
  }
};

// Save seen job IDs to AsyncStorage
const saveSeenJobIdsToStorage = async (jobIds: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SEEN_JOBS, JSON.stringify(jobIds));
  } catch (error) {
    console.error('Error saving seen jobs to storage:', error);
  }
};

// Get seen job IDs from Firestore (for authenticated users)
const getSeenJobIdsFromFirestore = async (userId: string): Promise<string[]> => {
  try {
    const userDocRef = doc(db, 'user_swipes', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.seenJobIds || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting seen jobs from Firestore:', error);
    return [];
  }
};

// Save seen job IDs to Firestore
const saveSeenJobIdsToFirestore = async (userId: string, jobIds: string[]): Promise<void> => {
  try {
    const userDocRef = doc(db, 'user_swipes', userId);
    await setDoc(userDocRef, {
      seenJobIds: jobIds,
      lastUpdated: new Date(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving seen jobs to Firestore:', error);
    // Fallback to AsyncStorage
    await saveSeenJobIdsToStorage(jobIds);
  }
};

// Get all seen job IDs (checks for daily reset first)
export const getSeenJobIds = async (): Promise<string[]> => {
  try {
    // Check if we should reset (new day)
    const shouldReset = await shouldResetSeenJobs();
    if (shouldReset) {
      // Clear seen jobs for new day
      const userId = await getUserId();
      if (userId) {
        await saveSeenJobIdsToFirestore(userId, []);
      } else {
        await saveSeenJobIdsToStorage([]);
      }
      return [];
    }

    const userId = await getUserId();
    if (userId) {
      // Authenticated user - use Firestore
      return await getSeenJobIdsFromFirestore(userId);
    } else {
      // Unauthenticated user - use AsyncStorage
      return await getSeenJobIdsFromStorage();
    }
  } catch (error) {
    console.error('Error getting seen job IDs:', error);
    return [];
  }
};

// Mark a job as seen (swiped left or right)
export const markJobAsSeen = async (jobId: string): Promise<void> => {
  try {
    const currentSeen = await getSeenJobIds();
    
    // Add job ID if not already seen
    if (!currentSeen.includes(jobId)) {
      const updatedSeen = [...currentSeen, jobId];
      
      const userId = await getUserId();
      if (userId) {
        await saveSeenJobIdsToFirestore(userId, updatedSeen);
      } else {
        await saveSeenJobIdsToStorage(updatedSeen);
      }
    }
  } catch (error) {
    console.error('Error marking job as seen:', error);
  }
};

// Reset seen jobs (for testing or manual reset)
export const resetSeenJobs = async (): Promise<void> => {
  try {
    const userId = await getUserId();
    if (userId) {
      await saveSeenJobIdsToFirestore(userId, []);
    } else {
      await saveSeenJobIdsToStorage([]);
    }
    await AsyncStorage.setItem(STORAGE_KEY_LAST_RESET, getTodayDate());
  } catch (error) {
    console.error('Error resetting seen jobs:', error);
  }
};


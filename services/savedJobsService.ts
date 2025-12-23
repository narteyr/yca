import { collection, addDoc, deleteDoc, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { SavedJob } from '@/types/user';
import { Job } from '@/types/job';

import AsyncStorage from '@react-native-async-storage/async-storage';

const getUserId = async (): Promise<string> => {
  const userId = await AsyncStorage.getItem('userId');
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
};

export const saveJob = async (jobId: string, notes?: string): Promise<string> => {
  try {
    const userId = await getUserId();
    
    // Check if job is already saved to prevent duplicates
    const isAlreadySaved = await isJobSaved(jobId);
    if (isAlreadySaved) {
      console.log('Job already saved:', jobId);
      // Return existing saved job ID (we need to find it)
      const q = query(
        collection(db, 'saved_jobs'),
        where('userId', '==', userId),
        where('jobId', '==', jobId)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
      }
    }
    
    const savedJobRef = await addDoc(collection(db, 'saved_jobs'), {
      userId,
      jobId,
      savedAt: new Date(),
      notes: notes || '',
    });
    return savedJobRef.id;
  } catch (error: any) {
    console.error('Error saving job:', error);
    
    // If it's a duplicate error, that's okay - job is already saved
    if (error.code === 'permission-denied' || error.message?.includes('already exists')) {
      console.log('Job may already be saved, continuing...');
      // Try to get the existing saved job ID
      try {
        const userId = await getUserId();
        const q = query(
          collection(db, 'saved_jobs'),
          where('userId', '==', userId),
          where('jobId', '==', jobId)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          return querySnapshot.docs[0].id;
        }
      } catch (e) {
        // Ignore this error
      }
    }
    
    // Hide all Firebase error details from users
    const genericError = new Error('Unable to save job at this time. Please try again later.');
    (genericError as any).isFirebaseError = true;
    throw genericError;
  }
};

export const unsaveJob = async (jobId: string): Promise<void> => {
  try {
    const userId = await getUserId();
    const q = query(
      collection(db, 'saved_jobs'),
      where('userId', '==', userId),
      where('jobId', '==', jobId)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (document) => {
      await deleteDoc(doc(db, 'saved_jobs', document.id));
    });
  } catch (error: any) {
    console.error('Error unsaving job:', error);
    
    // Hide all Firebase error details from users
    const genericError = new Error('Unable to remove saved job at this time. Please try again later.');
    (genericError as any).isFirebaseError = true;
    throw genericError;
  }
};

export const isJobSaved = async (jobId: string): Promise<boolean> => {
  try {
    const userId = await getUserId();
    const q = query(
      collection(db, 'saved_jobs'),
      where('userId', '==', userId),
      where('jobId', '==', jobId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if job is saved:', error);
    return false;
  }
};

export const getSavedJobs = async (): Promise<SavedJob[]> => {
  try {
    const userId = await getUserId();
    const q = query(
      collection(db, 'saved_jobs'),
      where('userId', '==', userId),
      orderBy('savedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const savedJobs: SavedJob[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      savedJobs.push({
        id: doc.id,
        userId: data.userId,
        jobId: data.jobId,
        savedAt: data.savedAt?.toDate() || new Date(),
        notes: data.notes || '',
        job: data.job || null,
      });
    });
    
    return savedJobs;
  } catch (error: any) {
    // If user is not authenticated, return empty array
    if (error.message === 'User not authenticated') {
      return [];
    }
    
    console.error('Error fetching saved jobs:', error);
    
    // Hide all Firebase error details from users
    const genericError = new Error('Unable to load saved jobs at this time. Please try again later.');
    (genericError as any).isFirebaseError = true;
    throw genericError;
  }
};

export const getSavedJobIds = async (): Promise<string[]> => {
  try {
    const savedJobs = await getSavedJobs();
    return savedJobs.map(job => job.jobId);
  } catch (error) {
    console.error('Error fetching saved job IDs:', error);
    return [];
  }
};


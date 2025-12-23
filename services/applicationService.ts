import { collection, addDoc, updateDoc, deleteDoc, query, where, getDocs, doc, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Application, ApplicationStatus } from '@/types/application';

import AsyncStorage from '@react-native-async-storage/async-storage';

const getUserId = async (): Promise<string> => {
  const userId = await AsyncStorage.getItem('userId');
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
};

export const createApplication = async (jobId: string, notes?: string): Promise<string> => {
  try {
    const userId = await getUserId();
    const applicationRef = await addDoc(collection(db, 'applications'), {
      userId,
      jobId,
      status: 'Applied' as ApplicationStatus,
      appliedAt: new Date(),
      notes: notes || '',
      updatedAt: new Date(),
    });
    return applicationRef.id;
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
};

export const updateApplicationStatus = async (
  applicationId: string,
  status: ApplicationStatus,
  notes?: string
): Promise<void> => {
  try {
    const applicationRef = doc(db, 'applications', applicationId);
    await updateDoc(applicationRef, {
      status,
      notes: notes || '',
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating application:', error);
    throw error;
  }
};

export const deleteApplication = async (applicationId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'applications', applicationId));
  } catch (error) {
    console.error('Error deleting application:', error);
    throw error;
  }
};

export const getApplications = async (): Promise<Application[]> => {
  try {
    const userId = await getUserId();
    const q = query(
      collection(db, 'applications'),
      where('userId', '==', userId),
      orderBy('appliedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const applications: Application[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      applications.push({
        id: doc.id,
        userId: data.userId,
        jobId: data.jobId,
        status: data.status as ApplicationStatus,
        appliedAt: data.appliedAt?.toDate() || new Date(),
        notes: data.notes || '',
        interviewDate: data.interviewDate?.toDate(),
        offerDetails: data.offerDetails || undefined,
        updatedAt: data.updatedAt?.toDate() || new Date(),
        job: data.job || null,
      });
    });
    
    return applications;
  } catch (error: any) {
    // If user is not authenticated, return empty array
    if (error.message === 'User not authenticated') {
      return [];
    }
    console.error('Error fetching applications:', error);
    throw error;
  }
};

export const getApplicationByJobId = async (jobId: string): Promise<Application | null> => {
  try {
    const userId = await getUserId();
    const q = query(
      collection(db, 'applications'),
      where('userId', '==', userId),
      where('jobId', '==', jobId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      jobId: data.jobId,
      status: data.status as ApplicationStatus,
      appliedAt: data.appliedAt?.toDate() || new Date(),
      notes: data.notes || '',
      interviewDate: data.interviewDate?.toDate(),
      offerDetails: data.offerDetails || undefined,
      updatedAt: data.updatedAt?.toDate() || new Date(),
      job: data.job || null,
    };
  } catch (error: any) {
    // If user is not authenticated, return null gracefully
    if (error.message === 'User not authenticated') {
      return null;
    }
    console.error('Error fetching application by job ID:', error);
    return null;
  }
};


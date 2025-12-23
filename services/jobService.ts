import { collection, getDocs, query, orderBy, limit, startAfter, where, QueryDocumentSnapshot, DocumentData, doc, getDoc, and } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Job } from '@/types/job';
import { JobFilters } from '@/types/filters';

export const fetchJobs = async (lastVisible?: QueryDocumentSnapshot<DocumentData>): Promise<{ jobs: Job[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    // Query for internships with source == 'startup'
    // Note: This query requires a Firestore composite index on:
    // - source (Ascending)
    // - job_type (Ascending)  
    // - created_at (Descending)
    // Firestore will provide a link to create the index if it doesn't exist
    let q = query(
      collection(db, 'jobs'),
      where('source', '==', 'startup'),
      where('job_type', '==', 'Internship'),
      orderBy('created_at', 'desc'),
      limit(10)
    );

    if (lastVisible) {
      q = query(
        collection(db, 'jobs'),
        where('source', '==', 'startup'),
        where('job_type', '==', 'Internship'),
        orderBy('created_at', 'desc'),
        startAfter(lastVisible),
        limit(10)
      );
    }

    const querySnapshot = await getDocs(q);
    const jobs: Job[] = [];
    let newLastVisible: QueryDocumentSnapshot<DocumentData> | null = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        title: data.title || '',
        company: data.company || '',
        location: data.location || 'Not specified',
        description: data.description || '',
        requirements: data.requirements || '',
        salary: data.salary || '',
        job_type: data.job_type || '',
        remote: data.remote || false,
        url: data.url || '',
        posted_date: data.posted_date || '',
        via: data.via || '',
        source: data.source || '',
        sponsors_visa: data.sponsors_visa || false,
        benefits: data.benefits || [],
        responsibilities: data.responsibilities || [],
        thumbnail: data.thumbnail || '',
        scraped_at: data.scraped_at || '',
        visa: data.visa || '',
        processed: data.processed || false,
        created_at: data.created_at?.toDate(),
        updated_at: data.updated_at?.toDate(),
      });
      newLastVisible = doc;
    });

    return { jobs, lastVisible: newLastVisible };
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    
    // Hide all Firebase error details from users
    // Throw a generic error that doesn't expose database structure
    const genericError = new Error('Unable to load jobs at this time. Please try again later.');
    (genericError as any).isFirebaseError = true;
    throw genericError;
  }
};

export const fetchJobsWithFilters = async (
  filters: JobFilters,
  lastVisible?: QueryDocumentSnapshot<DocumentData>
): Promise<{ jobs: Job[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    const conditions: any[] = [
      where('source', '==', 'startup'),
      where('job_type', '==', 'Internship'),
    ];

    // Apply filters
    if (filters.remote !== null && filters.remote !== undefined) {
      conditions.push(where('remote', '==', filters.remote));
    }
    if (filters.visaSponsorship !== null && filters.visaSponsorship !== undefined) {
      conditions.push(where('sponsors_visa', '==', filters.visaSponsorship));
    }
    if (filters.jobType) {
      conditions.push(where('job_type', '==', filters.jobType));
    }

    conditions.push(orderBy('created_at', 'desc'));
    conditions.push(limit(10));

    let q = query(collection(db, 'jobs'), ...conditions);

    if (lastVisible) {
      conditions.pop(); // Remove limit
      conditions.pop(); // Remove orderBy
      conditions.push(orderBy('created_at', 'desc'));
      conditions.push(startAfter(lastVisible));
      conditions.push(limit(10));
      q = query(collection(db, 'jobs'), ...conditions);
    }

    const querySnapshot = await getDocs(q);
    const jobs: Job[] = [];
    let newLastVisible: QueryDocumentSnapshot<DocumentData> | null = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const job: Job = {
        id: doc.id,
        title: data.title || '',
        company: data.company || '',
        location: data.location || 'Not specified',
        description: data.description || '',
        requirements: data.requirements || '',
        salary: data.salary || '',
        job_type: data.job_type || '',
        remote: data.remote || false,
        url: data.url || '',
        posted_date: data.posted_date || '',
        via: data.via || '',
        source: data.source || '',
        sponsors_visa: data.sponsors_visa || false,
        benefits: data.benefits || [],
        responsibilities: data.responsibilities || [],
        thumbnail: data.thumbnail || '',
        scraped_at: data.scraped_at || '',
        visa: data.visa || '',
        processed: data.processed || false,
        created_at: data.created_at?.toDate(),
        updated_at: data.updated_at?.toDate(),
      };

      // Client-side filtering for location and salary (since Firestore has limitations)
      let includeJob = true;

      if (filters.locations && filters.locations.length > 0) {
        const jobLocation = job.location.toLowerCase();
        includeJob = filters.locations.some(loc => 
          jobLocation.includes(loc.toLowerCase())
        );
      }

      if (includeJob && filters.salaryRange) {
        // Extract salary from string (basic parsing)
        const salaryMatch = job.salary.match(/\$?(\d+)/);
        if (salaryMatch) {
          const salary = parseInt(salaryMatch[1]);
          if (filters.salaryRange.min && salary < filters.salaryRange.min) {
            includeJob = false;
          }
          if (filters.salaryRange.max && salary > filters.salaryRange.max) {
            includeJob = false;
          }
        }
      }

      if (includeJob) {
        jobs.push(job);
        newLastVisible = doc;
      }
    });

    return { jobs, lastVisible: newLastVisible };
  } catch (error: any) {
    console.error('Error fetching filtered jobs:', error);
    
    // Hide all Firebase error details from users
    const genericError = new Error('Unable to load jobs at this time. Please try again later.');
    (genericError as any).isFirebaseError = true;
    throw genericError;
  }
};

export const fetchJobById = async (jobId: string): Promise<Job | null> => {
  try {
    const docRef = doc(db, 'jobs', jobId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title || '',
      company: data.company || '',
      location: data.location || 'Not specified',
      description: data.description || '',
      requirements: data.requirements || '',
      salary: data.salary || '',
      job_type: data.job_type || '',
      remote: data.remote || false,
      url: data.url || '',
      posted_date: data.posted_date || '',
      via: data.via || '',
      source: data.source || '',
      sponsors_visa: data.sponsors_visa || false,
      benefits: data.benefits || [],
      responsibilities: data.responsibilities || [],
      thumbnail: data.thumbnail || '',
      scraped_at: data.scraped_at || '',
      visa: data.visa || '',
      processed: data.processed || false,
      created_at: data.created_at?.toDate(),
      updated_at: data.updated_at?.toDate(),
      ai_summary: data.ai_summary || '',
    };
  } catch (error) {
    console.error('Error fetching job by ID:', error);
    // Return null silently for individual job fetch errors
    return null;
  }
};

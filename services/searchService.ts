import { collection, getDocs, query, where, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Job } from '@/types/job';

export const searchJobs = async (
  searchTerm: string,
  lastVisible?: QueryDocumentSnapshot<DocumentData>
): Promise<{ jobs: Job[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return { jobs: [], lastVisible: null };
    }

    const searchLower = searchTerm.toLowerCase().trim();
    
    // Firestore doesn't support full-text search, so we'll fetch and filter client-side
    // For better performance, you could use Algolia or similar service
    let q = query(
      collection(db, 'jobs'),
      where('source', '==', 'startup'),
      where('job_type', '==', 'Internship'),
      orderBy('created_at', 'desc'),
      limit(50) // Fetch more for client-side filtering
    );

    if (lastVisible) {
      q = query(
        collection(db, 'jobs'),
        where('source', '==', 'startup'),
        where('job_type', '==', 'Internship'),
        orderBy('created_at', 'desc'),
        startAfter(lastVisible),
        limit(50)
      );
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

      // Client-side search filtering
      const searchableText = `${job.title} ${job.company} ${job.description} ${job.location}`.toLowerCase();
      if (searchableText.includes(searchLower)) {
        jobs.push(job);
        newLastVisible = doc;
      }
    });

    return { jobs, lastVisible: newLastVisible };
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw error;
  }
};


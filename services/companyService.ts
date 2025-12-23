import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Job } from '@/types/job';

export const getCompanyJobs = async (companyName: string): Promise<Job[]> => {
  try {
    const q = query(
      collection(db, 'jobs'),
      where('company', '==', companyName),
      where('source', '==', 'startup'),
      orderBy('created_at', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const jobs: Job[] = [];

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
    });

    return jobs;
  } catch (error) {
    console.error('Error fetching company jobs:', error);
    return [];
  }
};

export const getCompanyStats = async (companyName: string) => {
  try {
    const jobs = await getCompanyJobs(companyName);
    return {
      totalJobs: jobs.length,
      internships: jobs.filter(j => j.job_type === 'Internship').length,
      fullTime: jobs.filter(j => j.job_type === 'Full-time').length,
      remoteJobs: jobs.filter(j => j.remote).length,
      visaSponsorship: jobs.filter(j => j.sponsors_visa).length,
    };
  } catch (error) {
    console.error('Error getting company stats:', error);
    return {
      totalJobs: 0,
      internships: 0,
      fullTime: 0,
      remoteJobs: 0,
      visaSponsorship: 0,
    };
  }
};


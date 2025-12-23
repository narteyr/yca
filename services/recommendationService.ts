import { getSavedJobs } from '@/services/savedJobsService';
import { getApplications } from '@/services/applicationService';
import { fetchJobs } from '@/services/jobService';
import { getUser } from '@/services/userService';
import { Job } from '@/types/job';
import { calculateMatchScore } from '@/utils/matchScore';

export const getRecommendedJobs = async (limit: number = 20): Promise<Job[]> => {
  try {
    // Get user preferences
    const user = await getUser();
    const preferences = user?.preferences;

    // Get saved jobs and applications to understand user interests
    const savedJobs = await getSavedJobs();
    const applications = await getApplications();

    // Get all jobs
    const { jobs } = await fetchJobs();

    // Calculate match scores and sort
    const jobsWithScores = jobs.map(job => ({
      job,
      score: calculateMatchScore(job, preferences),
      // Boost score if similar to saved/applied jobs
      similarityBonus: calculateSimilarityBonus(job, savedJobs, applications),
    }));

    // Combine scores
    const finalScores = jobsWithScores.map(({ job, score, similarityBonus }) => ({
      job,
      finalScore: score + similarityBonus,
    }));

    // Sort by final score and return top jobs
    return finalScores
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, limit)
      .map(item => item.job);
  } catch (error) {
    console.error('Error getting recommended jobs:', error);
    // Fallback to regular jobs
    const { jobs } = await fetchJobs();
    return jobs.slice(0, limit);
  }
};

const calculateSimilarityBonus = (
  job: Job,
  savedJobs: any[],
  applications: any[]
): number => {
  let bonus = 0;

  // Check if similar companies were saved/applied
  const savedCompanies = savedJobs.map(sj => sj.job?.company?.toLowerCase() || '');
  const appliedCompanies = applications.map(app => app.job?.company?.toLowerCase() || '');
  const allCompanies = [...savedCompanies, ...appliedCompanies];
  
  if (allCompanies.includes(job.company.toLowerCase())) {
    bonus += 20;
  }

  // Check if similar locations were saved/applied
  const savedLocations = savedJobs.map(sj => sj.job?.location?.toLowerCase() || '');
  const appliedLocations = applications.map(app => app.job?.location?.toLowerCase() || '');
  const allLocations = [...savedLocations, ...appliedLocations];
  
  if (allLocations.some(loc => job.location.toLowerCase().includes(loc) || loc.includes(job.location.toLowerCase()))) {
    bonus += 10;
  }

  // Check if similar job types were saved/applied
  const savedJobTypes = savedJobs.map(sj => sj.job?.job_type || '');
  const appliedJobTypes = applications.map(app => app.job?.job_type || '');
  const allJobTypes = [...savedJobTypes, ...appliedJobTypes];
  
  if (allJobTypes.includes(job.job_type)) {
    bonus += 15;
  }

  return Math.min(bonus, 30); // Cap bonus at 30 points
};


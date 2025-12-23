import { getSavedJobs } from '@/services/savedJobsService';
import { getApplications } from '@/services/applicationService';
import { fetchJobs } from '@/services/jobService';

export interface AnalyticsData {
  totalJobsViewed: number;
  totalJobsSaved: number;
  totalApplications: number;
  applicationsByStatus: {
    Applied: number;
    Interview: number;
    Offer: number;
    Rejected: number;
    Withdrawn: number;
  };
  averageMatchScore: number;
  applicationSuccessRate: number;
  topCompanies: Array<{ company: string; count: number }>;
  topLocations: Array<{ location: string; count: number }>;
}

export const getAnalytics = async (): Promise<AnalyticsData> => {
  try {
    const savedJobs = await getSavedJobs();
    const applications = await getApplications();
    const { jobs } = await fetchJobs();

    // Calculate applications by status
    const applicationsByStatus = {
      Applied: applications.filter(app => app.status === 'Applied').length,
      Interview: applications.filter(app => app.status === 'Interview').length,
      Offer: applications.filter(app => app.status === 'Offer').length,
      Rejected: applications.filter(app => app.status === 'Rejected').length,
      Withdrawn: applications.filter(app => app.status === 'Withdrawn').length,
    };

    // Calculate success rate (Offers / Total Applications)
    const totalApplications = applications.length;
    const offers = applicationsByStatus.Offer;
    const applicationSuccessRate = totalApplications > 0 
      ? Math.round((offers / totalApplications) * 100) 
      : 0;

    // Get top companies
    const companyCounts: Record<string, number> = {};
    [...savedJobs, ...applications].forEach(item => {
      const company = item.job?.company || 'Unknown';
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    });
    const topCompanies = Object.entries(companyCounts)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get top locations
    const locationCounts: Record<string, number> = {};
    [...savedJobs, ...applications].forEach(item => {
      const location = item.job?.location || 'Unknown';
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });
    const topLocations = Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalJobsViewed: jobs.length, // Approximate
      totalJobsSaved: savedJobs.length,
      totalApplications: totalApplications,
      applicationsByStatus,
      averageMatchScore: 0, // Would need to calculate from viewed jobs
      applicationSuccessRate,
      topCompanies,
      topLocations,
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    return {
      totalJobsViewed: 0,
      totalJobsSaved: 0,
      totalApplications: 0,
      applicationsByStatus: {
        Applied: 0,
        Interview: 0,
        Offer: 0,
        Rejected: 0,
        Withdrawn: 0,
      },
      averageMatchScore: 0,
      applicationSuccessRate: 0,
      topCompanies: [],
      topLocations: [],
    };
  }
};


import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { getSavedJobs } from '@/services/savedJobsService';
import { getApplications } from '@/services/applicationService';
import { fetchJobById } from '@/services/jobService';
import { generateCSV } from '@/utils/exportUtils';

export const exportSavedJobs = async (): Promise<void> => {
  try {
    const savedJobs = await getSavedJobs();
    const jobPromises = savedJobs.map(savedJob => fetchJobById(savedJob.jobId));
    const jobs = (await Promise.all(jobPromises)).filter(job => job !== null);

    const headers = [
      'Title',
      'Company',
      'Location',
      'Job Type',
      'Remote',
      'Visa Sponsorship',
      'Salary',
      'URL',
      'Description',
    ];

    const csvContent = generateCSV(jobs, headers);
    const filename = `saved_jobs_${new Date().toISOString().split('T')[0]}.csv`;

    // Create a temporary file and share it
    if (await Sharing.isAvailableAsync()) {
      // Note: In a real implementation, you'd write to a file first
      // For now, we'll just log the CSV content
      console.log('CSV Content:', csvContent);
      Alert.alert('Export', 'CSV export functionality requires file system access. Content logged to console.');
    } else {
      Alert.alert('Error', 'Sharing is not available on this device.');
    }
  } catch (error) {
    console.error('Error exporting saved jobs:', error);
    throw error;
  }
};

export const exportApplications = async (): Promise<void> => {
  try {
    const applications = await getApplications();
    const jobPromises = applications.map(app => fetchJobById(app.jobId));
    const jobs = (await Promise.all(jobPromises)).filter(job => job !== null);

    const headers = [
      'Title',
      'Company',
      'Location',
      'Status',
      'Applied Date',
      'URL',
    ];

    const csvRows = applications.map((app, index) => {
      const job = jobs[index];
      if (!job) return '';
      return [
        `"${job.title}"`,
        `"${job.company}"`,
        `"${job.location}"`,
        `"${app.status}"`,
        `"${app.appliedAt.toISOString()}"`,
        `"${job.url}"`,
      ].join(',');
    });

    const csvContent = [headers.map(h => `"${h}"`).join(','), ...csvRows].join('\n');
    const filename = `applications_${new Date().toISOString().split('T')[0]}.csv`;

    if (await Sharing.isAvailableAsync()) {
      console.log('CSV Content:', csvContent);
      Alert.alert('Export', 'CSV export functionality requires file system access. Content logged to console.');
    } else {
      Alert.alert('Error', 'Sharing is not available on this device.');
    }
  } catch (error) {
    console.error('Error exporting applications:', error);
    throw error;
  }
};


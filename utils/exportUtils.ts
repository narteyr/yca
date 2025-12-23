export const formatJobForCSV = (job: any): string => {
  const fields = [
    job.title || '',
    job.company || '',
    job.location || '',
    job.job_type || '',
    job.remote ? 'Yes' : 'No',
    job.sponsors_visa ? 'Yes' : 'No',
    job.salary || '',
    job.url || '',
    job.description || '',
  ];
  return fields.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
};

export const generateCSV = (jobs: any[], headers: string[]): string => {
  const csvHeaders = headers.map(h => `"${h}"`).join(',');
  const csvRows = jobs.map(job => formatJobForCSV(job));
  return [csvHeaders, ...csvRows].join('\n');
};

export const saveToFile = async (content: string, filename: string, mimeType: string) => {
  // This would typically use a file system API
  // For React Native, we'll use expo-sharing
  return { content, filename, mimeType };
};


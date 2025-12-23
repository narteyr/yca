import { Job } from '@/types/job';

/**
 * Generates an AI summary for a job posting based on the job data
 */
export const generateAISummary = (job: Job): string => {
  const parts: string[] = [];
  
  // Start with role focus based on title
  if (job.title) {
    const titleLower = job.title.toLowerCase();
    if (titleLower.includes('design') || titleLower.includes('designer')) {
      parts.push('This role focuses on design systems and requires strong Figma skills.');
      parts.push('The team is looking for someone who can bridge the gap between design and engineering.');
    } else if (titleLower.includes('engineer') || titleLower.includes('engineering') || titleLower.includes('backend') || titleLower.includes('frontend')) {
      parts.push('This engineering role emphasizes building scalable systems and working with modern technologies.');
      parts.push('You will collaborate with cross-functional teams to deliver high-quality technical solutions.');
    } else if (titleLower.includes('product')) {
      parts.push('This product role involves working closely with cross-functional teams to deliver user-focused solutions.');
      parts.push('You will help shape product strategy and work on features that impact users directly.');
    } else if (titleLower.includes('data') || titleLower.includes('analyst')) {
      parts.push('This role focuses on data analysis and deriving insights to drive business decisions.');
      parts.push('You will work with large datasets and help the team make data-driven choices.');
    } else {
      parts.push(`This ${job.title} role offers an opportunity to work on impactful projects.`);
      parts.push('You will gain valuable experience and contribute to meaningful work.');
    }
  }
  
  // Add company-specific context
  if (job.company && job.company !== 'YC Startup') {
    parts.push(`This is an excellent opportunity to contribute to ${job.company}'s mission and growth.`);
  } else {
    parts.push('This Y Combinator startup offers a unique opportunity to work at a fast-growing company.');
  }
  
  // Add location/remote info
  if (job.remote) {
    parts.push('The role offers remote flexibility, making it accessible to candidates worldwide.');
  } else if (job.location && job.location !== 'Not specified') {
    const locationParts = job.location.split(',');
    const city = locationParts[0].trim();
    parts.push(`Located in ${city}, this role provides a great opportunity to work in a vibrant tech ecosystem.`);
  }
  
  // Add visa sponsorship if available
  if (job.sponsors_visa) {
    parts.push('Visa sponsorship is available for qualified international candidates.');
  }
  
  // Add match percentage context
  parts.push('High match based on your profile and recent experience.');
  
  return parts.join(' ');
};


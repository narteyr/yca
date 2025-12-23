import { Job } from '@/types/job';
import { UserPreferences } from '@/types/user';

export const calculateMatchScore = (job: Job, preferences?: UserPreferences): number => {
  let bonusPoints = 0; // Bonus points (0-20) added to base score of 80
  let maxBonus = 0;

  // Remote preference match (up to 3 bonus points)
  if (preferences?.remoteOnly !== undefined) {
    maxBonus += 3;
    if (preferences.remoteOnly && job.remote) {
      bonusPoints += 3;
    } else if (!preferences.remoteOnly && !job.remote) {
      bonusPoints += 3;
    } else if (preferences.remoteOnly === false && job.remote) {
      bonusPoints += 1; // Partial match
    }
  }

  // Visa sponsorship match (up to 3 bonus points)
  if (preferences?.visaSponsorshipRequired !== undefined) {
    maxBonus += 3;
    if (preferences.visaSponsorshipRequired && job.sponsors_visa) {
      bonusPoints += 3;
    } else if (!preferences.visaSponsorshipRequired) {
      bonusPoints += 2; // Not required, so any job is fine
    } else {
      bonusPoints += 0.5; // Required but not available
    }
  }

  // Location preference match (up to 4 bonus points)
  if (preferences?.preferredLocations && preferences.preferredLocations.length > 0) {
    maxBonus += 4;
    const jobLocation = job.location.toLowerCase();
    const hasMatch = preferences.preferredLocations.some(loc =>
      jobLocation.includes(loc.toLowerCase())
    );
    if (hasMatch) {
      bonusPoints += 4;
    } else {
      bonusPoints += 1; // Partial match
    }
  }

  // Salary range match (up to 2 bonus points)
  if (preferences?.salaryRange) {
    maxBonus += 2;
    const salaryMatch = job.salary.match(/\$?(\d+)/);
    if (salaryMatch) {
      const salary = parseInt(salaryMatch[1]);
      const { min, max } = preferences.salaryRange;
      if (min && max && salary >= min && salary <= max) {
        bonusPoints += 2;
      } else if (min && salary >= min) {
        bonusPoints += 1.5;
      } else if (max && salary <= max) {
        bonusPoints += 1.5;
      } else {
        bonusPoints += 0.3;
      }
    } else {
      bonusPoints += 0.5; // No salary info
    }
  }

  // Job type match (up to 3 bonus points)
  if (preferences?.jobTypes && preferences.jobTypes.length > 0) {
    maxBonus += 3;
    // Check if job title or description matches preferred job types
    const jobTitleLower = job.title.toLowerCase();
    const jobDescLower = (job.description || '').toLowerCase();
    const hasMatch = preferences.jobTypes.some(type => 
      jobTitleLower.includes(type.toLowerCase()) || 
      jobDescLower.includes(type.toLowerCase())
    );
    if (hasMatch || preferences.jobTypes.includes(job.job_type)) {
      bonusPoints += 3;
    } else {
      bonusPoints += 0.5; // Partial match
    }
  }

  // Skills match (up to 4 bonus points)
  if (preferences?.skills && preferences.skills.length > 0) {
    maxBonus += 4;
    const jobText = `${job.title} ${job.description} ${job.requirements || ''}`.toLowerCase();
    const matchedSkills = preferences.skills.filter(skill =>
      jobText.includes(skill.toLowerCase())
    );
    const matchRatio = matchedSkills.length / preferences.skills.length;
    bonusPoints += 4 * matchRatio;
  }

  // Experience level match (up to 2 bonus points)
  if (preferences?.experienceLevel) {
    maxBonus += 2;
    // Jobs with more detailed requirements might indicate need for experience
    const hasDetailedRequirements = (job.requirements || '').length > 100;
    const hasResponsibilities = job.responsibilities && job.responsibilities.length > 0;
    
    if (preferences.experienceLevel === 'No Experience' && !hasDetailedRequirements) {
      bonusPoints += 2;
    } else if (preferences.experienceLevel === 'Some Experience' && !hasDetailedRequirements) {
      bonusPoints += 2;
    } else if (preferences.experienceLevel === 'Moderate Experience' && (hasDetailedRequirements || hasResponsibilities)) {
      bonusPoints += 2;
    } else if (preferences.experienceLevel === 'Experienced' && (hasDetailedRequirements || hasResponsibilities)) {
      bonusPoints += 2;
    } else {
      bonusPoints += 1; // Partial match
    }
  }

  // Other relevance match (up to 2 bonus points)
  if (preferences?.otherRelevance && preferences.otherRelevance.length > 0) {
    maxBonus += 2;
    const jobText = `${job.title} ${job.description} ${job.company || ''}`.toLowerCase();
    const matchedRelevance = preferences.otherRelevance.filter(item => {
      const itemLower = item.toLowerCase();
      if (itemLower.includes('startup')) {
        return job.source === 'startup' || jobText.includes('startup');
      }
      return jobText.includes(itemLower);
    });
    const matchRatio = matchedRelevance.length / preferences.otherRelevance.length;
    bonusPoints += 2 * matchRatio;
  }

  // Calculate final score: base 80 + bonus (capped at 20)
  const finalScore = 80 + Math.min(Math.round(bonusPoints), 20);

  // Ensure score is between 80 and 100
  return Math.min(Math.max(finalScore, 80), 100);
};


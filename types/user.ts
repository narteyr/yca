export interface User {
  id: string;
  email?: string;
  name?: string;
  preferences?: UserPreferences;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserPreferences {
  preferredLocations?: string[];
  preferredSalaryRange?: {
    min?: number;
    max?: number;
  };
  remoteOnly?: boolean;
  visaSponsorshipRequired?: boolean;
  jobTypes?: string[]; // ["Internship", "Full-time", "Software Engineering", "Product Management", etc.]
  skills?: string[];
  // Onboarding fields
  graduationYear?: string;
  major?: string;
  studentStatus?: 'National' | 'International';
  experienceLevel?: string; // "No Experience", "Some Experience", "Moderate Experience", "Experienced"
  otherRelevance?: string[]; // ["Startup Experience", "Open Source", "Research", etc.]
  // Resume embedding
  resumeEmbedding?: number[]; // Vector embedding of resume text
  resumeProcessed?: boolean; // Whether resume has been processed
  // Settings
  notificationsEnabled?: boolean; // Whether notifications are enabled
}

export interface SavedJob {
  id: string;
  userId: string;
  jobId: string;
  savedAt: Date;
  notes?: string;
  job?: any; // Full job data snapshot
}


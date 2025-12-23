export type ApplicationStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn';

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt: Date;
  notes?: string;
  interviewDate?: Date;
  offerDetails?: {
    salary?: string;
    startDate?: string;
    notes?: string;
  };
  updatedAt: Date;
  job?: any; // Full job data snapshot
}


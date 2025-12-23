export interface JobFilters {
  locations?: string[];
  salaryRange?: {
    min?: number;
    max?: number;
  };
  remote?: boolean | null; // null = any, true = remote only, false = on-site only
  visaSponsorship?: boolean | null;
  jobType?: string; // "Internship" | "Full-time" | null
}

export const defaultFilters: JobFilters = {
  locations: undefined,
  salaryRange: undefined,
  remote: null,
  visaSponsorship: null,
  jobType: null,
};


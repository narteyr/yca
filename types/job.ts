export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
  salary: string;
  job_type: string; // "Internship" or "Full-time"
  remote: boolean;
  url: string;
  posted_date: string;
  via: string;
  source: string; // Should be "startup" for YC jobs
  sponsors_visa: boolean;
  benefits: string[];
  responsibilities: string[];
  thumbnail: string;
  scraped_at: string;
  visa?: string;
  processed?: boolean;
  created_at?: Date;
  updated_at?: Date;
  ai_summary?: string; // AI-generated summary
}

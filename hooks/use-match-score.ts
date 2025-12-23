import { getUser } from '@/services/userService';
import { Job } from '@/types/job';
import { UserPreferences } from '@/types/user';
import { calculateMatchScore } from '@/utils/matchScore';
import { useEffect, useMemo, useState } from 'react';

export const useMatchScore = (job: Job | null) => {
  const [preferences, setPreferences] = useState<UserPreferences | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await getUser();
        setPreferences(user?.preferences);
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate match score using useMemo to ensure consistent calculation
  const matchScore = useMemo(() => {
    if (!job || loading) {
      return 80; // Default score while loading
    }

    // Calculate match score based on user preferences from onboarding survey
    return calculateMatchScore(job, preferences);
  }, [job, preferences, loading]);

  return matchScore;
};


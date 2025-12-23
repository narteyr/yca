import { useState, useEffect } from 'react';
import { Job } from '@/types/job';
import { UserPreferences } from '@/types/user';
import { calculateMatchScore } from '@/utils/matchScore';
import { getUser } from '@/services/userService';

export const useMatchScore = (job: Job | null) => {
  const [preferences, setPreferences] = useState<UserPreferences | undefined>(undefined);
  const [matchScore, setMatchScore] = useState<number>(80);
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

  useEffect(() => {
    if (!job || loading) {
      setMatchScore(80);
      return;
    }

    // Calculate match score based on user preferences from onboarding survey
    const score = calculateMatchScore(job, preferences);
    setMatchScore(score);
  }, [job, preferences, loading]);

  return matchScore;
};


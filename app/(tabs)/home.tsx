import LoadingScreen from '@/components/loading-screen';
import MatchStrengthCard from '@/components/match-strength-card';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { fetchJobs, fetchJobsWithFilters } from '@/services/jobService';
import { getSavedJobs } from '@/services/savedJobsService';
import { getUser } from '@/services/userService';
import { Job } from '@/types/job';
import { UserPreferences } from '@/types/user';
import { calculateMatchScore } from '@/utils/matchScore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface QuickFilter {
  id: string;
  label: string;
  icon: string;
  active: boolean;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences | undefined>(undefined);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>([
    { id: 'remote', label: 'Remote Only', icon: 'home-outline', active: false },
    { id: 'visa', label: 'Visa Sponsorship', icon: 'globe-outline', active: false },
    { id: 'highMatch', label: 'High Match (80%+)', icon: 'star-outline', active: false },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (preferences) {
      loadJobs();
    }
  }, [preferences, quickFilters]);

  const loadData = async () => {
    try {
      const userData = await getUser();
      setPreferences(userData?.preferences);
      
      // Load saved jobs for historical data
      if (user) {
        try {
          const saved = await getSavedJobs();
          // Fetch full job data for saved jobs
          const { fetchJobById } = await import('@/services/jobService');
          const savedJobData = await Promise.all(
            saved.map(savedJob => fetchJobById(savedJob.jobId))
          );
          setSavedJobs(savedJobData.filter(job => job !== null) as Job[]);
        } catch (error) {
          console.error('Error loading saved jobs:', error);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      
      const activeFilters = quickFilters.filter(f => f.active);
      let result;
      
      if (activeFilters.length > 0) {
        const filters: any = {};
        if (activeFilters.find(f => f.id === 'remote')) {
          filters.remote = true;
        }
        if (activeFilters.find(f => f.id === 'visa')) {
          filters.visaSponsorship = true;
        }
        result = await fetchJobsWithFilters(filters);
      } else {
        result = await fetchJobs();
      }
      
      let filteredJobs = result.jobs;
      
      // Apply high match filter if active
      if (activeFilters.find(f => f.id === 'highMatch')) {
        filteredJobs = filteredJobs.filter(job => {
          // Calculate match score for filtering using the same logic as other screens
          const score = calculateMatchScore(job, preferences);
          return score >= 80;
        });
      }
      
      setJobs(filteredJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filterId: string) => {
    setQuickFilters(prev => 
      prev.map(f => f.id === filterId ? { ...f, active: !f.active } : f)
    );
  };


  const getMatchInsights = (job: Job, prefs?: UserPreferences): string[] => {
    const insights: string[] = [];
    
    if (!prefs) return insights;
    
    if (prefs.remoteOnly && job.remote) {
      insights.push('Matches remote preference');
    }
    
    if (prefs.visaSponsorshipRequired && job.sponsors_visa) {
      insights.push('Offers visa sponsorship');
    }
    
    if (prefs.preferredLocations && prefs.preferredLocations.length > 0) {
      const jobLocation = job.location?.toLowerCase() || '';
      const matchesLocation = prefs.preferredLocations.some(loc => 
        jobLocation.includes(loc.toLowerCase())
      );
      if (matchesLocation) {
        insights.push('Matches location preference');
      }
    }
    
    if (prefs.skills && prefs.skills.length > 0 && job.requirements) {
      const jobReq = job.requirements.toLowerCase();
      const matchingSkills = prefs.skills.filter(skill => 
        jobReq.includes(skill.toLowerCase())
      );
      if (matchingSkills.length > 0) {
        insights.push(`Requires your skills: ${matchingSkills.slice(0, 2).join(', ')}`);
      }
    }
    
    if (prefs.studentStatus === 'International' && job.sponsors_visa) {
      insights.push('Perfect for international students');
    }
    
    return insights;
  };

  const renderJobCard = ({ item }: { item: Job }) => {
    const matchScore = calculateMatchScore(item, preferences);
    const insights = getMatchInsights(item, preferences);
    
    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => router.push(`/details?id=${item.id}`)}
        activeOpacity={0.7}>
        <View style={styles.jobHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle}>{item.title}</Text>
            <Text style={styles.companyName}>{item.company || 'YC Startup'}</Text>
            <View style={styles.jobMeta}>
              <Ionicons name="location-outline" size={14} color="#666666" />
              <Text style={styles.metaText}>{item.location || 'Not specified'}</Text>
            </View>
          </View>
          <View style={[styles.matchBadge, matchScore >= 80 && styles.matchBadgeHigh]}>
            <Text style={[styles.matchScore, matchScore >= 80 && styles.matchScoreHigh]}>{matchScore}%</Text>
          </View>
        </View>
        
        {insights.length > 0 && (
          <View style={styles.insightsContainer}>
            {insights.slice(0, 2).map((insight, idx) => (
              <View key={idx} style={styles.insightBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#FF6B35" />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}
        
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Calculate average match score and chart data using actual data
  const matchMetrics = useMemo(() => {
    // Get current day of week (0 = Sunday, 6 = Saturday)
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Day labels starting from Sunday
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    if (!preferences) {
      // Generate default data for the week
      const defaultData = dayLabels.map((label, index) => ({
        value: 80 + (index * 0.5),
        label,
      }));
      return {
        averageScore: 85,
        trend: 0,
        chartData: defaultData,
      };
    }

    // Combine current jobs and saved jobs for more data points
    const allJobs = [...jobs, ...savedJobs];
    
    if (allJobs.length === 0) {
      // Generate default data for the week
      const defaultData = dayLabels.map((label, index) => ({
        value: 80 + (index * 0.5),
        label,
      }));
      return {
        averageScore: 85,
        trend: 0,
        chartData: defaultData,
      };
    }

    // Calculate match scores for all jobs
    const allScores = allJobs.map(job => calculateMatchScore(job, preferences));
    
    // Calculate average match score from current jobs
    const currentScores = jobs.length > 0 
      ? jobs.map(job => calculateMatchScore(job, preferences))
      : allScores;
    const averageScore = Math.round(
      currentScores.reduce((sum, score) => sum + score, 0) / currentScores.length
    );

    // Generate chart data for the full week (Sunday to Saturday)
    // Distribute scores across the week based on actual data distribution
    const sortedScores = [...allScores].sort((a, b) => a - b);
    const scoreCount = sortedScores.length;
    
    // Calculate percentiles for distribution across the week
    const getPercentile = (percentile: number) => {
      const index = Math.floor(scoreCount * percentile);
      return sortedScores[index] || averageScore;
    };
    
    // Generate 7 data points for the week (Sunday to Saturday)
    // Distribute actual scores across the week, with current day showing current average
    const chartData = dayLabels.map((label, dayIndex) => {
      let value: number;
      
      if (dayIndex === currentDayOfWeek) {
        // Current day shows the current average
        value = averageScore;
      } else if (dayIndex < currentDayOfWeek) {
        // Past days: use lower percentiles (showing progression)
        const progress = dayIndex / 7;
        value = Math.max(80, getPercentile(progress * 0.6)); // Use lower 60% of scores
      } else {
        // Future days: use higher percentiles (projected improvement)
        const progress = (dayIndex - currentDayOfWeek) / (7 - currentDayOfWeek);
        value = Math.max(80, averageScore + (progress * 2)); // Slight upward trend
      }
      
      return {
        value: Math.max(80, Math.min(100, Math.round(value))),
        label,
      };
    });

    // Calculate trend based on saved jobs vs current jobs
    // If we have saved jobs, compare their average to current average
    let trend = 0;
    if (savedJobs.length > 0 && jobs.length > 0) {
      const savedScores = savedJobs.map(job => calculateMatchScore(job, preferences));
      const savedAverage = Math.round(
        savedScores.reduce((sum, score) => sum + score, 0) / savedScores.length
      );
      trend = Math.max(0, Math.round(averageScore - savedAverage));
    } else if (allScores.length >= 2) {
      // Use first half vs second half of scores as trend indicator
      const firstHalf = allScores.slice(0, Math.floor(allScores.length / 2));
      const secondHalf = allScores.slice(Math.floor(allScores.length / 2));
      const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
      trend = Math.max(0, Math.round(secondAvg - firstAvg));
    }

    return {
      averageScore,
      trend,
      chartData,
    };
  }, [jobs, savedJobs, preferences]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.contentWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Home</Text>
            
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => router.push('/(tabs)/news')}>
              <Ionicons name="newspaper-outline" size={20} color="#FF6B35" />
              <Text style={styles.headerButtonText}>News</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.discoverButton}
              onPress={() => router.replace('/(tabs)')}>
              <Ionicons name="compass-outline" size={20} color="#FF6B35" />
              <Text style={styles.discoverButtonText}>Discover</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Discover your next opportunity</Text>

        {/* Match Strength Dashboard */}
        <MatchStrengthCard
          matchScore={matchMetrics.averageScore}
          trend={matchMetrics.trend}
          status="Ready"
          chartData={matchMetrics.chartData}
        />

        {/* Jobs List */}
        {loading ? (
          <LoadingScreen message="Loading jobs..." />
        ) : jobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Jobs Found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your filters or check back later for new opportunities
            </Text>
          </View>
        ) : (
          <FlatList
            data={jobs}
            renderItem={renderJobCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  contentWrapper: {
    flex: 1,
    paddingBottom: 100, // Space for bottom navbar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    paddingLeft: 20,
    paddingBottom: 10,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#666666',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
    gap: 6,
  },
  headerButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: '#FF6B35',
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
    gap: 6,
  },
  discoverButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: '#FF6B35',
  },
  filterChipsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#666666',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
  },
  list: {
    padding: 20,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#000000',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#666666',
    marginBottom: 8,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#666666',
  },
  matchBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  matchBadgeHigh: {
    backgroundColor: '#FF6B35',
  },
  matchScore: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#000000',
  },
  matchScoreHigh: {
    color: '#FFFFFF',
  },
  insightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  insightText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#FF6B35',
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#333333',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#666666',
    textAlign: 'center',
  },
});


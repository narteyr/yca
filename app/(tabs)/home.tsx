import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { fetchJobs, fetchJobsWithFilters } from '@/services/jobService';
import { useAuth } from '@/contexts/auth-context';
import { Job } from '@/types/job';
import { Fonts } from '@/constants/theme';
import { useMatchScore } from '@/hooks/use-match-score';
import { getUser } from '@/services/userService';
import { UserPreferences } from '@/types/user';

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
  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>([
    { id: 'remote', label: 'Remote Only', icon: 'home-outline', active: false },
    { id: 'visa', label: 'Visa Sponsorship', icon: 'globe-outline', active: false },
    { id: 'highMatch', label: 'High Match (80%+)', icon: 'star-outline', active: false },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (preferences) {
      loadJobs();
    }
  }, [preferences, quickFilters]);

  const loadData = async () => {
    try {
      const userData = await getUser();
      setPreferences(userData?.preferences);
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
          // Calculate match score for filtering
          const score = calculateQuickMatchScore(job, preferences);
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

  const calculateQuickMatchScore = (job: Job, prefs?: UserPreferences): number => {
    let score = 80; // Base score
    
    if (!prefs) return score;
    
    // Remote preference
    if (prefs.remoteOnly && job.remote) {
      score += 5;
    } else if (prefs.remoteOnly && !job.remote) {
      score -= 10;
    }
    
    // Visa sponsorship
    if (prefs.visaSponsorshipRequired && job.sponsors_visa) {
      score += 5;
    } else if (prefs.visaSponsorshipRequired && !job.sponsors_visa) {
      score -= 10;
    }
    
    // Location match
    if (prefs.preferredLocations && prefs.preferredLocations.length > 0) {
      const jobLocation = job.location?.toLowerCase() || '';
      const matchesLocation = prefs.preferredLocations.some(loc => 
        jobLocation.includes(loc.toLowerCase())
      );
      if (matchesLocation) score += 5;
    }
    
    // Skills match
    if (prefs.skills && prefs.skills.length > 0 && job.requirements) {
      const jobReq = job.requirements.toLowerCase();
      const matchingSkills = prefs.skills.filter(skill => 
        jobReq.includes(skill.toLowerCase())
      );
      if (matchingSkills.length > 0) score += matchingSkills.length * 2;
    }
    
    return Math.min(100, Math.max(0, score));
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
    const matchScore = calculateQuickMatchScore(item, preferences);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.contentWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Home</Text>
            <Text style={styles.headerSubtitle}>Discover your next opportunity</Text>
          </View>
          <TouchableOpacity 
            style={styles.discoverButton}
            onPress={() => router.replace('/(tabs)')}>
            <Ionicons name="compass-outline" size={20} color="#FF6B35" />
            <Text style={styles.discoverButtonText}>Discover</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsContainer}>
          {quickFilters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                filter.active && styles.filterChipActive
              ]}
              onPress={() => toggleFilter(filter.id)}>
              <Ionicons 
                name={filter.icon as any} 
                size={16} 
                color={filter.active ? '#FFFFFF' : '#666666'} 
              />
              <Text style={[
                styles.filterChipText,
                filter.active && styles.filterChipTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Jobs List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Loading jobs...</Text>
          </View>
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
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#666666',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: '#666666',
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
  matchBadgeHigh: {
    backgroundColor: '#FF6B35',
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


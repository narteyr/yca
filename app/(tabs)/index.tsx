import FilterModal from '@/components/filter-modal';
import SwipeableCard from '@/components/swipeable-card';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useFilters } from '@/hooks/use-filters';
import { fetchJobs, fetchJobsWithFilters } from '@/services/jobService';
import { saveJob } from '@/services/savedJobsService';
import { Job } from '@/types/job';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiscoverScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [indexError, setIndexError] = useState<boolean>(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const { filters, isFilterActive, updateFilters, clearFilters } = useFilters();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setIndexError(false);
        setLastVisible(null);
      }
      
      let result;
      if (isFilterActive) {
        result = await fetchJobsWithFilters(filters, reset ? undefined : lastVisible);
      } else {
        result = await fetchJobs(reset ? undefined : lastVisible);
      }
      
      if (reset) {
        setJobs(result.jobs);
        if (result.jobs.length > 0) {
          setCurrentJob(result.jobs[0]);
          setCurrentIndex(0);
        }
      } else {
        setJobs(prev => [...prev, ...result.jobs]);
      }
      setLastVisible(result.lastVisible);
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      
      // Set generic error state for any Firebase error
      if (error?.isFirebaseError || error?.message) {
        setIndexError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (newFilters: any) => {
    // Don't allow filter changes when there's an error
    if (indexError) return;
    updateFilters(newFilters);
    loadJobs(true);
  };

  const handleSwipeLeft = () => {
    if (currentIndex < jobs.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      if (jobs[nextIndex]) {
        setCurrentJob(jobs[nextIndex]);
      }
    } else {
      // Load more jobs when reaching the end
      if (lastVisible) {
        loadJobs(false);
      } else {
        // No more jobs, reload
        loadJobs(true);
      }
    }
  };

  const handleSwipeRight = async () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to save jobs.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth/signin') },
        ]
      );
      return;
    }

    if (currentJob) {
      try {
        await saveJob(currentJob.id);
        console.log('Job saved:', currentJob.id);
      } catch (error: any) {
        console.error('Error saving job:', error);
        if (error.message === 'User not authenticated') {
          Alert.alert('Error', 'Please sign in to save jobs.');
        } else {
          Alert.alert('Error', 'Unable to save job at this time. Please try again later.');
        }
      }
    }
    // Move to next job after saving
    handleSwipeLeft();
  };


  const getCompanyLogoText = (companyName: string) => {
    if (!companyName) return 'YC';
    return companyName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 4);
  };

  const getTags = (job: Job) => {
    const tags: string[] = [];
    if (job.job_type) tags.push(job.job_type);
    if (job.remote) tags.push('Remote');
    if (job.sponsors_visa) tags.push('Visa Sponsorship');
    // Add any other relevant tags from responsibilities or benefits if needed
    return tags;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading internships...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (indexError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="cloud-offline-outline" size={64} color="#FF6B35" />
          </View>
          <Text style={styles.errorTitle}>Something Went Wrong</Text>
          <Text style={styles.errorText}>
            We're having trouble loading jobs right now. Please check your connection and try again.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setIndexError(false);
              loadJobs(true);
            }}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentJob) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No internships available</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get the next few jobs for the card stack
  const visibleJobs = jobs.slice(currentIndex, currentIndex + 3);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.contentWrapper}>
      
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerIcon}
          onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="person-circle-outline" size={28} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity 
          style={styles.headerIcon}
          onPress={() => setFilterModalVisible(true)}>
          <Ionicons 
            name="options-outline" 
            size={28} 
            color={isFilterActive ? "#FF6B35" : "#000000"} 
          />
          {isFilterActive && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      {/* Card Stack */}
      <View style={styles.cardStack} pointerEvents="box-none">
        {visibleJobs.map((job, index) => (
          <SwipeableCard
            key={job.id}
            job={job}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            index={index}
            isTop={index === 0}
          />
        )).reverse()}
      </View>



      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onApply={handleApplyFilters}
        onClear={clearFilters}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: '#F7F5F2',
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
  },
  cardStack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  swipeHint: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  swipeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swipeHintText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#999999',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIconContainer: {
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
});

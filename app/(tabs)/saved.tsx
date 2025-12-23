import { StyleSheet, View, Text, TouchableOpacity, StatusBar, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { getSavedJobs, unsaveJob } from '@/services/savedJobsService';
import { fetchJobById } from '@/services/jobService';
import { useAuth } from '@/contexts/auth-context';
import { SavedJob } from '@/types/user';
import { Job } from '@/types/job';
import { Fonts } from '@/constants/theme';

export default function SavedJobsScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexError, setIndexError] = useState<boolean>(false);

  useEffect(() => {
    // Only load saved jobs if user is authenticated
    if (user && !authLoading) {
      loadSavedJobs();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Refresh saved jobs when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user && !authLoading) {
        loadSavedJobs();
      }
    }, [user, authLoading])
  );

  const loadSavedJobs = async () => {
    try {
      setLoading(true);
      setIndexError(false);
      const saved = await getSavedJobs();
      setSavedJobs(saved);
      
      // Fetch full job data for each saved job
      const jobPromises = saved.map(savedJob => fetchJobById(savedJob.jobId));
      const jobResults = await Promise.all(jobPromises);
      const validJobs = jobResults.filter(job => job !== null) as Job[];
      
      // Remove duplicates by using a Map with job.id as key
      const uniqueJobsMap = new Map<string, Job>();
      validJobs.forEach(job => {
        if (job && job.id && !uniqueJobsMap.has(job.id)) {
          uniqueJobsMap.set(job.id, job);
        }
      });
      
      setJobs(Array.from(uniqueJobsMap.values()));
    } catch (error: any) {
      console.error('Error loading saved jobs:', error);
      
      // Set generic error state for any Firebase error
      if (error?.isFirebaseError || error?.message) {
        setIndexError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (jobId: string) => {
    // Don't allow unsaving when there's an error
    if (indexError) return;
    
    try {
      await unsaveJob(jobId);
      setSavedJobs(prev => prev.filter(job => job.jobId !== jobId));
      setJobs(prev => prev.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Error unsaving job:', error);
      // Show generic error message
      Alert.alert('Error', 'Unable to remove saved job at this time. Please try again later.');
    }
  };

  const renderJob = ({ item }: { item: Job }) => (
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
        <TouchableOpacity
          style={styles.unsaveButton}
          onPress={() => handleUnsave(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="bookmark" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>
      {item.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading saved jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Please sign in to view saved jobs</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (indexError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.contentWrapper}>
          <View style={styles.errorContainer}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="cloud-offline-outline" size={64} color="#FF6B35" />
            </View>
            <Text style={styles.errorTitle}>Something Went Wrong</Text>
            <Text style={styles.errorText}>
              We're having trouble loading your saved jobs right now. Please check your connection and try again.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setIndexError(false);
                loadSavedJobs();
              }}
              activeOpacity={0.7}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.contentWrapper}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Jobs</Text>
        <Text style={styles.headerSubtitle}>{jobs.length} saved</Text>
      </View>

      {jobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Saved Jobs</Text>
          <Text style={styles.emptyText}>
            Swipe right on jobs you like to save them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderJob}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  list: {
    padding: 20,
  },
  jobCard: {
    backgroundColor: '#F7F5F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
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
    color: '#666666',
  },
  unsaveButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
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
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
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


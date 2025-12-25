import { useMatchScore } from '@/hooks/use-match-score';
import { createApplication, getApplicationByJobId } from '@/services/applicationService';
import { fetchJobById } from '@/services/jobService';
import { Job } from '@/types/job';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Linking, ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DetailsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplied, setIsApplied] = useState(false);
  const matchScore = useMatchScore(job);

  useEffect(() => {
    if (id) {
      loadJob();
      checkApplicationStatus();
    }
  }, [id]);

  const checkApplicationStatus = async () => {
    if (!id) return;
    try {
      const application = await getApplicationByJobId(id);
      setIsApplied(application !== null);
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const loadJob = async () => {
    try {
      setLoading(true);
      const jobData = await fetchJobById(id!);
      setJob(jobData);
    } catch (error) {
      console.error('Error loading job:', error);
    } finally {
      setLoading(false);
    }
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

  const getCompanyLogoColor = (companyName: string): string => {
    // Generate a consistent color based on company name
    if (!companyName) return '#1A7F7E';
    
    const colors = [
      '#1A7F7E', // Teal
      '#00C853', // Green
      '#FF6B35', // Orange
      '#9B59B6', // Purple
      '#3498DB', // Blue
      '#E74C3C', // Red
      '#F39C12', // Orange/Yellow
    ];
    
    let hash = 0;
    for (let i = 0; i < companyName.length; i++) {
      hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleApply = () => {
    if (job?.url) {
      Linking.openURL(job.url);
    }
  };

  const handleShare = async () => {
    if (!job) return;
    try {
      const shareContent = {
        message: `Check out this ${job.job_type} position at ${job.company}: ${job.title}\n${job.url}`,
        url: job.url,
        title: `${job.title} at ${job.company}`,
      };
      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing job:', error);
    }
  };

  const handleMarkAsApplied = async () => {
    if (!job) return;
    try {
      await createApplication(job.id);
      setIsApplied(true);
      Alert.alert('Success', 'Job marked as applied!');
    } catch (error) {
      console.error('Error marking as applied:', error);
      Alert.alert('Error', 'Failed to mark job as applied. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Job not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const locationText = job.remote && job.location.toLowerCase().includes('remote')
    ? job.location
    : job.location || 'Not specified';

  const logoColor = getCompanyLogoColor(job.company);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => {
            // Check if we can go back, otherwise navigate to main tabs
            if (navigation.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Company Logo Card */}
        <View style={[styles.logoCard, { backgroundColor: logoColor }]}>
          {job.thumbnail && job.thumbnail.trim() !== '' ? (
            <Image source={{ uri: job.thumbnail }} style={styles.logoImage} />
          ) : (
            <Text style={styles.logoText}>{getCompanyLogoText(job.company)}</Text>
          )}
        </View>

        {/* Job Title */}
        <Text style={styles.jobTitle}>{job.title}</Text>

        {/* Company and Location */}
        <Text style={styles.companyLocation}>
          {job.company || 'YC Startup'} • {locationText}
        </Text>

        {/* Match Badge */}
        <View style={styles.matchBadge}>
          <Ionicons name="sparkles" size={16} color="#9B59B6" />
          <Text style={styles.matchText}>{matchScore}% Match</Text>
        </View>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {job.remote && (
            <View style={styles.tag}>
              <Ionicons name="globe-outline" size={16} color="#000000" />
              <Text style={styles.tagText}>Remote Friendly</Text>
            </View>
          )}
          {job.salary && (
            <View style={styles.tag}>
              <Ionicons name="cash-outline" size={16} color="#000000" />
              <Text style={styles.tagText}>{job.salary}</Text>
            </View>
          )}
          <View style={styles.tag}>
            <Ionicons name="time-outline" size={16} color="#000000" />
            <Text style={styles.tagText}>12 Weeks</Text>
          </View>
        </View>

        {/* About The Role Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT THE ROLE</Text>
          
          {/* Job Description */}
          {job.description ? (
            <Text style={styles.sectionText}>
              {job.description}
            </Text>
          ) : (
            <Text style={styles.sectionText}>
              Join {job.company || 'our team'} to help build innovative solutions. This {job.job_type?.toLowerCase() || 'internship'} role offers an excellent opportunity to gain hands-on experience and contribute to meaningful projects.
            </Text>
          )}

          {/* Job Type and Location Details */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="briefcase-outline" size={20} color="#FF6B35" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Job Type</Text>
                <Text style={styles.detailValue}>{job.job_type || 'Internship'}</Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={20} color="#FF6B35" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{locationText}</Text>
              </View>
            </View>

            {job.remote && (
              <View style={styles.detailItem}>
                <Ionicons name="globe-outline" size={20} color="#FF6B35" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Work Arrangement</Text>
                  <Text style={styles.detailValue}>Remote Friendly</Text>
                </View>
              </View>
            )}

            {job.sponsors_visa && (
              <View style={styles.detailItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FF6B35" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Visa Sponsorship</Text>
                  <Text style={styles.detailValue}>Available</Text>
                </View>
              </View>
            )}

            {job.salary && (
              <View style={styles.detailItem}>
                <Ionicons name="cash-outline" size={20} color="#FF6B35" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Compensation</Text>
                  <Text style={styles.detailValue}>{job.salary}</Text>
                </View>
              </View>
            )}

            {job.posted_date && (
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={20} color="#FF6B35" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Posted</Text>
                  <Text style={styles.detailValue}>{job.posted_date}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Requirements */}
          {job.requirements && (
            <>
              <Text style={styles.sectionSubtitle}>Requirements</Text>
              <Text style={styles.sectionText}>{job.requirements}</Text>
            </>
          )}

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <>
              <Text style={styles.sectionSubtitle}>Key Responsibilities</Text>
              {job.responsibilities.map((resp, index) => (
                <View key={index} style={styles.bulletPoint}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.sectionText}>{resp}</Text>
                </View>
              ))}
            </>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <>
              <Text style={styles.sectionSubtitle}>Benefits</Text>
              {job.benefits.map((benefit, index) => (
                <View key={index} style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.bulletIcon} />
                  <Text style={styles.sectionText}>{benefit}</Text>
                </View>
              ))}
            </>
          )}

          {/* Source Information */}
          {job.via && (
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceText}>Via {job.via}</Text>
            </View>
          )}
        </View>

        {/* Spacer for button */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {!isApplied ? (
          <>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Now</Text>
              <Ionicons name="arrow-up" size={20} color="#FFFFFF" style={styles.arrowIcon} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.markAppliedButton} 
              onPress={handleMarkAsApplied}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#666666" />
              <Text style={styles.markAppliedButtonText}>Mark as Applied</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.appliedContainer}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Now</Text>
              <Ionicons name="arrow-up" size={20} color="#FFFFFF" style={styles.arrowIcon} />
            </TouchableOpacity>
            <View style={styles.appliedBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#2ECC71" />
              <Text style={styles.appliedBadgeText}>Marked as Applied</Text>
            </View>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
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
    borderBottomColor: '#F0F0F0',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  logoCard: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  jobTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  companyLocation: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 16,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#E8D5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  matchText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9B59B6',
    marginLeft: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  detailsGrid: {
    marginTop: 16,
    marginBottom: 16,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#FF6B35',
    marginRight: 8,
    fontWeight: 'bold',
  },
  bulletIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  sourceInfo: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sourceText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  spacer: {
    height: 100,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F7F5F2',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  applyButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  arrowIcon: {
    transform: [{ rotate: '45deg' }],
  },
  markAppliedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  markAppliedButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  appliedContainer: {
    gap: 12,
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    gap: 8,
  },
  appliedBadgeText: {
    color: '#2ECC71',
    fontSize: 14,
    fontWeight: '600',
  },
});


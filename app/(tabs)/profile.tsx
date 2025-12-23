import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ScrollView, Switch, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { getUser, updateUserPreferences, getUserStats } from '@/services/userService';
import { useAuth } from '@/contexts/auth-context';
import { User } from '@/types/user';
import { Fonts } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user: authUser, signOut, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ savedJobs: 0, applications: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    // Only load user data if user is authenticated
    if (authUser && !authLoading) {
      loadUserData();
    }
  }, [authUser, authLoading]);

  // Refresh stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (authUser && !authLoading) {
        loadUserData();
      }
    }, [authUser, authLoading])
  );

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await getUser();
      const userStats = await getUserStats();
      setUser(userData);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (key: string, value: any) => {
    if (!user || !authUser) return;
    try {
      await updateUserPreferences({ [key]: value });
      setUser({
        ...user,
        preferences: {
          ...user.preferences,
          [key]: value,
        },
      });
    } catch (error) {
      console.error('Error updating preference:', error);
      // Don't show error to user, just log it
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
              await AsyncStorage.removeItem('onboardingComplete');
              router.replace('/auth/signin');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!authUser) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Please sign in to view your profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.contentWrapper}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Navigation */}
        <View style={styles.topNav}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => router.push('/(tabs)')}>
            <Ionicons name="home-outline" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
        </View>

        {/* Stats - Jobs Saved and Applications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="bookmark" size={24} color="#FF6B35" />
              <Text style={styles.statNumber}>{stats.savedJobs}</Text>
              <Text style={styles.statLabel}>Jobs Saved</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="briefcase" size={24} color="#FF6B35" />
              <Text style={styles.statNumber}>{stats.applications}</Text>
              <Text style={styles.statLabel}>Applications</Text>
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Preferences</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Remote Only</Text>
              <Text style={styles.preferenceDescription}>Show only remote jobs</Text>
            </View>
            <Switch
              value={user?.preferences?.remoteOnly || false}
              onValueChange={(value) => handlePreferenceChange('remoteOnly', value)}
              trackColor={{ false: '#E0E0E0', true: '#FF6B35' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Visa Sponsorship Required</Text>
              <Text style={styles.preferenceDescription}>Filter for jobs with visa sponsorship</Text>
            </View>
            <Switch
              value={user?.preferences?.visaSponsorshipRequired || false}
              onValueChange={(value) => handlePreferenceChange('visaSponsorshipRequired', value)}
              trackColor={{ false: '#E0E0E0', true: '#FF6B35' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Ionicons 
              name={expandedSection === 'personal' ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#666666" 
            />
          </TouchableOpacity>
          
          {expandedSection === 'personal' && (
            <View style={styles.expandedContent}>
              {/* Graduation Year */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Graduation Year</Text>
                <View style={styles.tagRow}>
                  {['2024', '2025', '2026', '2027', 'Later / Alumni'].map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.tag,
                        user?.preferences?.graduationYear === year && styles.tagSelected,
                      ]}
                      onPress={() => handlePreferenceChange('graduationYear', year)}>
                      <Text style={[
                        styles.tagText,
                        user?.preferences?.graduationYear === year && styles.tagTextSelected,
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Major */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Major</Text>
                <TextInput
                  style={styles.textInput}
                  value={user?.preferences?.major || ''}
                  onChangeText={(text) => handlePreferenceChange('major', text)}
                  placeholder="Enter your major"
                  placeholderTextColor="#999999"
                />
              </View>

              {/* Student Status */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Student Status</Text>
                <View style={styles.tagRow}>
                  {['National', 'International'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.tag,
                        user?.preferences?.studentStatus === status && styles.tagSelected,
                      ]}
                      onPress={() => handlePreferenceChange('studentStatus', status)}>
                      <Text style={[
                        styles.tagText,
                        user?.preferences?.studentStatus === status && styles.tagTextSelected,
                      ]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Internship Preferences */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setExpandedSection(expandedSection === 'internship' ? null : 'internship')}>
            <Text style={styles.sectionTitle}>Internship Preferences</Text>
            <Ionicons 
              name={expandedSection === 'internship' ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#666666" 
            />
          </TouchableOpacity>
          
          {expandedSection === 'internship' && (
            <View style={styles.expandedContent}>
              {/* Preferred Locations */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Preferred Locations</Text>
                <View style={styles.tagRow}>
                  {['San Francisco', 'New York', 'Remote', 'Seattle', 'Boston', 'Austin', 'Los Angeles'].map((location) => {
                    const isSelected = user?.preferences?.preferredLocations?.includes(location);
                    return (
                      <TouchableOpacity
                        key={location}
                        style={[
                          styles.tag,
                          isSelected && styles.tagSelected,
                        ]}
                        onPress={() => {
                          const current = user?.preferences?.preferredLocations || [];
                          const updated = isSelected
                            ? current.filter(l => l !== location)
                            : [...current, location];
                          handlePreferenceChange('preferredLocations', updated);
                        }}>
                        <Text style={[
                          styles.tagText,
                          isSelected && styles.tagTextSelected,
                        ]}>
                          {location}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Experience Level */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Experience Level</Text>
                <View style={styles.tagRow}>
                  {['No Experience', 'Some Experience', 'Moderate Experience', 'Experienced'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.tag,
                        user?.preferences?.experienceLevel === level && styles.tagSelected,
                      ]}
                      onPress={() => handlePreferenceChange('experienceLevel', level)}>
                      <Text style={[
                        styles.tagText,
                        user?.preferences?.experienceLevel === level && styles.tagTextSelected,
                      ]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Skills */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Skills</Text>
                <View style={styles.tagRow}>
                  {['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Machine Learning', 'Data Analysis', 'UI/UX Design'].map((skill) => {
                    const isSelected = user?.preferences?.skills?.includes(skill);
                    return (
                      <TouchableOpacity
                        key={skill}
                        style={[
                          styles.tag,
                          isSelected && styles.tagSelected,
                        ]}
                        onPress={() => {
                          const current = user?.preferences?.skills || [];
                          const updated = isSelected
                            ? current.filter(s => s !== skill)
                            : [...current, skill];
                          handlePreferenceChange('skills', updated);
                        }}>
                        <Text style={[
                          styles.tagText,
                          isSelected && styles.tagTextSelected,
                        ]}>
                          {skill}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          {/* Notifications */}
          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons name="notifications-outline" size={24} color="#000000" />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Switch
              value={user?.preferences?.notificationsEnabled !== false} // Default to true
              onValueChange={(value) => handlePreferenceChange('notificationsEnabled', value)}
              trackColor={{ false: '#E0E0E0', true: '#FF6B35' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  contentWrapper: {
    flex: 1,
    paddingBottom: 100, // Space for bottom navbar
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  homeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: '#000000',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: '#000000',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#666666',
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#000000',
  },
  expandedContent: {
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: '#666666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: '#FFFFFF',
  },
  tagSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  tagText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#4A4A4A',
  },
  tagTextSelected: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: '#000000',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#666666',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: '#000000',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E74C3C',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
    marginTop: 16,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
});


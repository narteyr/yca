import { StyleSheet, View, Text, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { getAnalytics, AnalyticsData } from '@/services/analyticsService';

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No analytics data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>Your job search insights</Text>
        </View>

        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="eye-outline" size={24} color="#3498DB" />
              <Text style={styles.statNumber}>{analytics.totalJobsViewed}</Text>
              <Text style={styles.statLabel}>Jobs Viewed</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="bookmark-outline" size={24} color="#FF6B35" />
              <Text style={styles.statNumber}>{analytics.totalJobsSaved}</Text>
              <Text style={styles.statLabel}>Jobs Saved</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="briefcase-outline" size={24} color="#9B59B6" />
              <Text style={styles.statNumber}>{analytics.totalApplications}</Text>
              <Text style={styles.statLabel}>Applications</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trophy-outline" size={24} color="#2ECC71" />
              <Text style={styles.statNumber}>{analytics.applicationSuccessRate}%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
          </View>
        </View>

        {/* Application Status Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application Status</Text>
          <View style={styles.statusList}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#3498DB' }]} />
              <Text style={styles.statusLabel}>Applied</Text>
              <Text style={styles.statusValue}>{analytics.applicationsByStatus.Applied}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#9B59B6' }]} />
              <Text style={styles.statusLabel}>Interview</Text>
              <Text style={styles.statusValue}>{analytics.applicationsByStatus.Interview}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#2ECC71' }]} />
              <Text style={styles.statusLabel}>Offer</Text>
              <Text style={styles.statusValue}>{analytics.applicationsByStatus.Offer}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#E74C3C' }]} />
              <Text style={styles.statusLabel}>Rejected</Text>
              <Text style={styles.statusValue}>{analytics.applicationsByStatus.Rejected}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#95A5A6' }]} />
              <Text style={styles.statusLabel}>Withdrawn</Text>
              <Text style={styles.statusValue}>{analytics.applicationsByStatus.Withdrawn}</Text>
            </View>
          </View>
        </View>

        {/* Top Companies */}
        {analytics.topCompanies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Companies</Text>
            {analytics.topCompanies.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemLeft}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.listItemText}>{item.company}</Text>
                </View>
                <Text style={styles.listItemValue}>{item.count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Top Locations */}
        {analytics.topLocations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Locations</Text>
            {analytics.topLocations.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemLeft}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.listItemText}>{item.location}</Text>
                </View>
                <Text style={styles.listItemValue}>{item.count}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
  scrollView: {
    flex: 1,
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
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  statusList: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusLabel: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  listItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
});


import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Application, ApplicationStatus } from '@/types/application';
import { Job } from '@/types/job';

interface ApplicationCardProps {
  application: Application;
  job: Job | null;
  onPress: () => void;
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
}

const statusColors: Record<ApplicationStatus, string> = {
  Applied: '#3498DB',
  Interview: '#9B59B6',
  Offer: '#2ECC71',
  Rejected: '#E74C3C',
  Withdrawn: '#95A5A6',
};

const statusIcons: Record<ApplicationStatus, string> = {
  Applied: 'send',
  Interview: 'calendar',
  Offer: 'checkmark-circle',
  Rejected: 'close-circle',
  Withdrawn: 'remove-circle',
};

export default function ApplicationCard({ application, job, onPress, onStatusChange }: ApplicationCardProps) {
  const statusColor = statusColors[application.status];
  const statusIcon = statusIcons[application.status];

  if (!job) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.companyName}>{job.company || 'YC Startup'}</Text>
          <View style={styles.meta}>
            <Ionicons name="location-outline" size={12} color="#666666" />
            <Text style={styles.metaText}>{job.location || 'Not specified'}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
          <Ionicons name={statusIcon as any} size={16} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>{application.status}</Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.dateText}>
          Applied {application.appliedAt.toLocaleDateString()}
        </Text>
        <View style={styles.statusButtons}>
          {application.status !== 'Applied' && (
            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => onStatusChange(application.id, 'Applied')}>
              <Text style={styles.statusButtonText}>Applied</Text>
            </TouchableOpacity>
          )}
          {application.status !== 'Interview' && (
            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => onStatusChange(application.id, 'Interview')}>
              <Text style={styles.statusButtonText}>Interview</Text>
            </TouchableOpacity>
          )}
          {application.status !== 'Offer' && (
            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => onStatusChange(application.id, 'Offer')}>
              <Text style={styles.statusButtonText}>Offer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
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
  header: {
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
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
});


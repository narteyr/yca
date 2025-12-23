import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JobFilters } from '@/types/filters';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: JobFilters;
  onApply: (filters: JobFilters) => void;
  onClear: () => void;
}

export default function FilterModal({ visible, onClose, filters, onApply, onClear }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<JobFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    onClear();
    setLocalFilters({
      locations: undefined,
      salaryRange: undefined,
      remote: null,
      visaSponsorship: null,
      jobType: null,
    });
  };

  const toggleRemote = (value: boolean | null) => {
    if (value === null) setLocalFilters({ ...localFilters, remote: true });
    else if (value === true) setLocalFilters({ ...localFilters, remote: false });
    else setLocalFilters({ ...localFilters, remote: null });
  };

  const toggleVisa = (value: boolean | null) => {
    if (value === null) setLocalFilters({ ...localFilters, visaSponsorship: true });
    else if (value === true) setLocalFilters({ ...localFilters, visaSponsorship: false });
    else setLocalFilters({ ...localFilters, visaSponsorship: null });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Remote Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Work Arrangement</Text>
              <View style={styles.options}>
                <TouchableOpacity
                  style={[styles.option, localFilters.remote === null && styles.optionActive]}
                  onPress={() => setLocalFilters({ ...localFilters, remote: null })}>
                  <Text style={[styles.optionText, localFilters.remote === null && styles.optionTextActive]}>
                    Any
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.option, localFilters.remote === true && styles.optionActive]}
                  onPress={() => setLocalFilters({ ...localFilters, remote: true })}>
                  <Text style={[styles.optionText, localFilters.remote === true && styles.optionTextActive]}>
                    Remote
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.option, localFilters.remote === false && styles.optionActive]}
                  onPress={() => setLocalFilters({ ...localFilters, remote: false })}>
                  <Text style={[styles.optionText, localFilters.remote === false && styles.optionTextActive]}>
                    On-site
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Visa Sponsorship */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Visa Sponsorship</Text>
              <View style={styles.options}>
                <TouchableOpacity
                  style={[styles.option, localFilters.visaSponsorship === null && styles.optionActive]}
                  onPress={() => setLocalFilters({ ...localFilters, visaSponsorship: null })}>
                  <Text style={[styles.optionText, localFilters.visaSponsorship === null && styles.optionTextActive]}>
                    Any
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.option, localFilters.visaSponsorship === true && styles.optionActive]}
                  onPress={() => setLocalFilters({ ...localFilters, visaSponsorship: true })}>
                  <Text style={[styles.optionText, localFilters.visaSponsorship === true && styles.optionTextActive]}>
                    Required
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.option, localFilters.visaSponsorship === false && styles.optionActive]}
                  onPress={() => setLocalFilters({ ...localFilters, visaSponsorship: false })}>
                  <Text style={[styles.optionText, localFilters.visaSponsorship === false && styles.optionTextActive]}>
                    Not Required
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Job Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Job Type</Text>
              <View style={styles.options}>
                <TouchableOpacity
                  style={[styles.option, localFilters.jobType === null && styles.optionActive]}
                  onPress={() => setLocalFilters({ ...localFilters, jobType: null })}>
                  <Text style={[styles.optionText, localFilters.jobType === null && styles.optionTextActive]}>
                    Any
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.option, localFilters.jobType === 'Internship' && styles.optionActive]}
                  onPress={() => setLocalFilters({ ...localFilters, jobType: 'Internship' })}>
                  <Text style={[styles.optionText, localFilters.jobType === 'Internship' && styles.optionTextActive]}>
                    Internship
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.option, localFilters.jobType === 'Full-time' && styles.optionActive]}
                  onPress={() => setLocalFilters({ ...localFilters, jobType: 'Full-time' })}>
                  <Text style={[styles.optionText, localFilters.jobType === 'Full-time' && styles.optionTextActive]}>
                    Full-time
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F7F5F2',
  },
  optionActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  optionText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});


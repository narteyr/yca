import { Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { updateUserPreferences } from '@/services/userService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

interface OnboardingData {
  graduationYear?: string;
  major?: string;
  studentStatus?: 'National' | 'International';
  preferredLocations?: string[];
  experienceLevel?: string;
  skills?: string[];
  internshipType?: string[];
  otherRelevance?: string[];
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [data, setData] = useState<OnboardingData>({});
  const [majorSearch, setMajorSearch] = useState('');
  const [resumeFile, setResumeFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [uploading, setUploading] = useState(false);

  const totalSteps = 5;

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/signin');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep((currentStep + 1) as OnboardingStep);
    } else {
      // Save onboarding data
      if (user) {
        try {
          await updateUserPreferences({
            graduationYear: data.graduationYear,
            major: data.major,
            studentStatus: data.studentStatus,
            preferredLocations: data.preferredLocations,
            experienceLevel: data.experienceLevel,
            skills: data.skills,
            jobTypes: data.internshipType,
            otherRelevance: data.otherRelevance,
          });

          // Mark onboarding as complete
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          await AsyncStorage.setItem('onboardingComplete', 'true');
          router.replace('/(tabs)');
        } catch (error) {
          console.error('Error saving onboarding data:', error);
          // Still navigate even if save fails
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          await AsyncStorage.setItem('onboardingComplete', 'true');
          router.replace('/(tabs)');
        }
      } else {
        // If no user, just mark onboarding as complete and navigate
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem('onboardingComplete', 'true');
        router.replace('/(tabs)');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
    } else {
      router.back();
    }
  };


  const popularMajors = [
    'Computer Science',
    'Business Admin',
    'Psychology',
    'Economics',
    'Biology',
    'Data Science',
  ];

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <Text style={styles.stepText}>STEP {currentStep} OF {totalSteps}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
      </View>
    </View>
  );

  const handleResumeUpload = async () => {
    try {
      setUploading(true);
      
      // Pick a document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setUploading(false);
        return;
      }

      const file = result.assets[0];
      
      // Check file size (10MB limit)
      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a file smaller than 10MB.');
        setUploading(false);
        return;
      }

      // Store file info in AsyncStorage (file is already cached by document picker)
      const fileInfo = {
        uri: file.uri, // This is the cached URI from document picker
        name: file.name,
        size: file.size,
        mimeType: file.mimeType || 'application/pdf',
        uploadedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('resumeFile', JSON.stringify(fileInfo));
      
      setResumeFile(result);
      setUploading(false);
      
      Alert.alert('Success', 'Resume uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      setUploading(false);
      Alert.alert('Error', 'Failed to upload resume. Please try again.');
    }
  };

  const handleAnalyzeResume = async () => {
    if (resumeFile && !resumeFile.canceled) {
      // Resume is uploaded, proceed to next step
      handleNext();
    } else {
      // No resume uploaded, show alert
      Alert.alert(
        'No Resume Uploaded',
        'Please upload your resume first or skip to continue.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Skip', onPress: handleNext },
        ]
      );
    }
  };

  const renderStep1 = () => {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.heading}>Upload your Resume</Text>
        <Text style={styles.description}>
          Let our AI analyze your skills and match you with top-tier internships instantly.
        </Text>

        {/* Upload Area */}
        <TouchableOpacity
          style={[styles.uploadArea, resumeFile && !resumeFile.canceled && styles.uploadAreaFilled]}
          onPress={handleResumeUpload}
          activeOpacity={0.7}
          disabled={uploading}>
          {uploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          ) : resumeFile && !resumeFile.canceled ? (
            <View style={styles.uploadedContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
              <Text style={styles.uploadedTitle}>Resume Uploaded</Text>
              <Text style={styles.uploadedFileName}>{resumeFile.assets[0].name}</Text>
              <TouchableOpacity
                style={styles.changeFileButton}
                onPress={handleResumeUpload}
                activeOpacity={0.8}>
                <Text style={styles.changeFileButtonText}>Change File</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.uploadIconContainer}>
                <View style={styles.uploadIconCircle}>
                  <Ionicons name="cloud-upload-outline" size={48} color="#FF6B35" />
                </View>
              </View>
              <Text style={styles.uploadAreaTitle}>Tap to browse files</Text>
              <Text style={styles.uploadAreaSubtext}>Upload from device, iCloud or Drive</Text>
              <TouchableOpacity
                style={styles.selectFileButton}
                onPress={handleResumeUpload}
                activeOpacity={0.8}>
                <Text style={styles.selectFileButtonText}>Select File</Text>
              </TouchableOpacity>
              <Text style={styles.fileFormatText}>PDF OR DOCX UP TO 10MB</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Manual Entry Option */}
        <TouchableOpacity
          style={styles.manualEntryLink}
          onPress={handleNext}>
          <Text style={styles.manualEntryText}>
            I don't have a resume handy,{' '}
            <Text style={styles.manualEntryLinkText}>enter manually</Text>
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStep2 = () => {
    const years = ['2024', '2025', '2026', '2027', 'Later / Alumni'];
    
    return (
      <View style={styles.stepContent}>
        <Text style={styles.heading}>What is your Graduation Year?</Text>
        <Text style={styles.description}>
          This helps our AI find roles with start dates that match your academic timeline.
        </Text>

        <View style={styles.optionsList}>
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.radioOption,
                data.graduationYear === year && styles.radioOptionSelected,
              ]}
              onPress={() => setData({ ...data, graduationYear: year })}>
              <View style={styles.radioButton}>
                {data.graduationYear === year && <View style={styles.radioButtonInner} />}
              </View>
              <Text style={[
                styles.radioText,
                data.graduationYear === year && styles.radioTextSelected,
              ]}>
                {year}
              </Text>
              {year === 'Later / Alumni' && (
                <Ionicons name="calendar-outline" size={20} color={data.graduationYear === year ? "#FF6B35" : "#666666"} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.heading}>What is your major?</Text>
      <Text style={styles.description}>
        This helps our AI find internships relevant to your field and connect you with peers.
      </Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search majors (e.g. Computer Science)"
          placeholderTextColor="#999999"
          value={majorSearch}
          onChangeText={setMajorSearch}
        />
      </View>

      <Text style={styles.sectionLabel}>POPULAR FIELDS</Text>
      <View style={styles.tagsContainer}>
        {popularMajors.map((major) => (
          <TouchableOpacity
            key={major}
            style={[
              styles.tag,
              data.major === major && styles.tagSelected,
            ]}
            onPress={() => {
              setData({ ...data, major });
              setMajorSearch(major);
            }}>
            <Text style={[
              styles.tagText,
              data.major === major && styles.tagTextSelected,
            ]}>
              {major}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => {
    const options = [
      {
        value: 'National' as const,
        label: 'National Student',
        subtext: 'Citizen / Permanent Resident',
        icon: 'flag-outline',
      },
      {
        value: 'International' as const,
        label: 'International Student',
        subtext: 'F-1 / J-1 Visa',
        icon: 'globe-outline',
      },
    ];

    return (
      <View style={styles.stepContent}>
        <Text style={styles.heading}>Are you an International or National Student?</Text>
        <Text style={styles.description}>
          This helps us filter internships that sponsor visas and match your eligibility.
        </Text>

        <View style={styles.optionsList}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.cardOption,
                data.studentStatus === option.value && styles.cardOptionSelected,
              ]}
              onPress={() => setData({ ...data, studentStatus: option.value })}>
              <View style={styles.cardOptionContent}>
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={data.studentStatus === option.value ? "#FF6B35" : "#666666"}
                />
                <View style={styles.cardOptionText}>
                  <Text style={[
                    styles.cardOptionLabel,
                    data.studentStatus === option.value && styles.cardOptionLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.cardOptionSubtext}>{option.subtext}</Text>
                </View>
              </View>
              {data.studentStatus === option.value && (
                <Ionicons name="checkmark-circle" size={24} color="#FF6B35" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#FF6B35" />
          <View style={styles.infoBoxContent}>
            <Text style={styles.infoBoxTitle}>Why do we ask this?</Text>
            <Text style={styles.infoBoxText}>
              Your residency status directly impacts which internship opportunities are legally available to you. We use this to save you time.
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderStep5 = () => {
    const popularLocations = ['San Francisco', 'New York', 'Remote', 'Seattle', 'Boston', 'Austin', 'Los Angeles'];
    const experienceLevels = ['No Experience', 'Some Experience', 'Moderate Experience', 'Experienced'];
    const popularSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Machine Learning', 'Data Analysis', 'UI/UX Design'];
    const internshipTypes = ['Software Engineering', 'Product Management', 'Data Science', 'Design', 'Marketing', 'Business Development'];
    const otherRelevance = ['Startup Experience', 'Open Source', 'Research', 'Leadership', 'Team Projects'];

    return (
      <View style={styles.stepContent}>
        <Text style={styles.heading}>What are your internship preferences?</Text>
        <Text style={styles.description}>
          We'll use this information to match you with the most relevant opportunities.
        </Text>

        {/* Location Preferences */}
        <Text style={styles.sectionLabel}>PREFERRED LOCATIONS</Text>
        <View style={styles.tagsContainer}>
          {popularLocations.map((location) => (
            <TouchableOpacity
              key={location}
              style={[
                styles.tag,
                data.preferredLocations?.includes(location) && styles.tagSelected,
              ]}
              onPress={() => {
                const current = data.preferredLocations || [];
                const updated = current.includes(location)
                  ? current.filter(l => l !== location)
                  : [...current, location];
                setData({ ...data, preferredLocations: updated });
              }}>
              <Text style={[
                styles.tagText,
                data.preferredLocations?.includes(location) && styles.tagTextSelected,
              ]}>
                {location}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Experience Level */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>EXPERIENCE LEVEL</Text>
        <View style={styles.optionsList}>
          {experienceLevels.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.radioOption,
                data.experienceLevel === level && styles.radioOptionSelected,
              ]}
              onPress={() => setData({ ...data, experienceLevel: level })}>
              <View style={styles.radioButton}>
                {data.experienceLevel === level && <View style={styles.radioButtonInner} />}
              </View>
              <Text style={[
                styles.radioText,
                data.experienceLevel === level && styles.radioTextSelected,
              ]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Skills */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>SKILLS</Text>
        <View style={styles.tagsContainer}>
          {popularSkills.map((skill) => (
            <TouchableOpacity
              key={skill}
              style={[
                styles.tag,
                data.skills?.includes(skill) && styles.tagSelected,
              ]}
              onPress={() => {
                const current = data.skills || [];
                const updated = current.includes(skill)
                  ? current.filter(s => s !== skill)
                  : [...current, skill];
                setData({ ...data, skills: updated });
              }}>
              <Text style={[
                styles.tagText,
                data.skills?.includes(skill) && styles.tagTextSelected,
              ]}>
                {skill}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Internship Types */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>INTERNSHIP TYPES</Text>
        <View style={styles.tagsContainer}>
          {internshipTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.tag,
                data.internshipType?.includes(type) && styles.tagSelected,
              ]}
              onPress={() => {
                const current = data.internshipType || [];
                const updated = current.includes(type)
                  ? current.filter(t => t !== type)
                  : [...current, type];
                setData({ ...data, internshipType: updated });
              }}>
              <Text style={[
                styles.tagText,
                data.internshipType?.includes(type) && styles.tagTextSelected,
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Other Relevance */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>OTHER RELEVANCE</Text>
        <View style={styles.tagsContainer}>
          {otherRelevance.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.tag,
                data.otherRelevance?.includes(item) && styles.tagSelected,
              ]}
              onPress={() => {
                const current = data.otherRelevance || [];
                const updated = current.includes(item)
                  ? current.filter(r => r !== item)
                  : [...current, item];
                setData({ ...data, otherRelevance: updated });
              }}>
              <Text style={[
                styles.tagText,
                data.otherRelevance?.includes(item) && styles.tagTextSelected,
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true; // Always allow proceeding from resume step
      case 2:
        return !!data.graduationYear;
      case 3:
        return !!data.major;
      case 4:
        return !!data.studentStatus;
      case 5:
        // At least one preference should be selected
        return !!(data.preferredLocations?.length || data.experienceLevel || data.skills?.length || data.internshipType?.length || data.otherRelevance?.length);
      default:
        return false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        {currentStep === 4 && (
          <TouchableOpacity onPress={handleNext} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderStepIndicator()}
        {renderCurrentStep()}
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !canProceed() && styles.continueButtonDisabled]}
          onPress={currentStep === 1 ? handleAnalyzeResume : handleNext}
          disabled={!canProceed()}>
          <Text style={[styles.continueButtonText, !canProceed() && styles.continueButtonTextDisabled]}>
            {currentStep === 5 ? 'Finish & Explore' : currentStep === 1 ? 'Analyze Resume' : 'Continue →'}
          </Text>
        </TouchableOpacity>
        {currentStep === 1 && (
          <TouchableOpacity onPress={handleNext} style={styles.skipLink}>
            <Text style={styles.skipLinkText}>Skip for now</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  skipButton: {
    padding: 4,
  },
  skipText: {
    fontSize: 16,
    color: '#666666',
  },
  scrollView: {
    flex: 1,
  },
  stepIndicator: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  stepContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 32,
  },
  uploadIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    alignSelf: 'center',
  },
  uploadButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 32,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
    minHeight: 280,
    justifyContent: 'center',
  },
  uploadAreaFilled: {
    borderColor: '#4CAF50',
    borderStyle: 'solid',
    backgroundColor: '#F0F9F0',
  },
  uploadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  uploadingText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#666666',
  },
  uploadedContainer: {
    alignItems: 'center',
    gap: 12,
  },
  uploadedTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#2E7D32',
    marginTop: 8,
  },
  uploadedFileName: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  changeFileButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginTop: 8,
  },
  changeFileButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: '#4CAF50',
  },
  uploadIconContainer: {
    marginBottom: 16,
  },
  uploadIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8EAF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadAreaTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#000000',
    marginBottom: 8,
  },
  uploadAreaSubtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#666666',
    marginBottom: 20,
  },
  selectFileButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  selectFileButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#000000',
  },
  fileFormatText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: '#999999',
    letterSpacing: 0.5,
  },
  manualEntryLink: {
    marginTop: 8,
    alignItems: 'center',
  },
  manualEntryText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#666666',
  },
  manualEntryLinkText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#FF6B35',
    textDecorationLine: 'underline',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  fileInfoText: {
    fontSize: 14,
    color: '#2E7D32',
    fontFamily: Fonts.medium,
  },
  uploadHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  uploadHintText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: Fonts.regular,
  },
  optionsList: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#F7F5F2',
  },
  radioOptionSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F2',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B35',
  },
  radioText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  radioTextSelected: {
    fontWeight: '600',
    color: '#FF6B35',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 1,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tagSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  tagText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#F7F5F2',
    marginBottom: 12,
  },
  cardOptionSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F2',
  },
  cardOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  cardOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  cardOptionLabelSelected: {
    color: '#FF6B35',
  },
  cardOptionSubtext: {
    fontSize: 14,
    color: '#666666',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  infoBoxContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#F7F5F2',
  },
  continueButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  continueButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  continueButtonTextDisabled: {
    color: '#999999',
  },
  sparkleIcon: {
    marginLeft: 8,
  },
  skipLink: {
    alignItems: 'center',
    marginTop: 12,
  },
  skipLinkText: {
    fontSize: 14,
    color: '#666666',
  },
});


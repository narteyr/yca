import React, { useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, PanResponder, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Job } from '@/types/job';
import { useMatchScore } from '@/hooks/use-match-score';
import { Fonts } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const ROTATION_RANGE = 10;

interface SwipeableCardProps {
  job: Job;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  index: number;
  isTop: boolean;
  onSwipeRef?: (swipeFunctions: { swipeLeft: () => void; swipeRight: () => void }) => void;
}

export default function SwipeableCard({
  job,
  onSwipeLeft,
  onSwipeRight,
  index,
  isTop,
  onSwipeRef,
}: SwipeableCardProps) {
  const router = useRouter();
  const position = useRef(new Animated.ValueXY()).current;
  const matchScore = useMatchScore(job);

  // Reset position when card becomes top and update swipe ref
  React.useEffect(() => {
    if (isTop) {
      position.setValue({ x: 0, y: 0 });
      if (onSwipeRef) {
        onSwipeRef({
          swipeLeft: () => forceSwipe('left'),
          swipeRight: () => forceSwipe('right'),
        });
      }
    }
  }, [isTop, forceSwipe, onSwipeRef]);

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
    return tags;
  };

  const triggerHaptic = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [`-${ROTATION_RANGE}deg`, '0deg', `${ROTATION_RANGE}deg`],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleTap = () => {
    if (isTop) {
      router.push(`/details?id=${job.id}`);
    }
  };

  const onSwipeComplete = React.useCallback((direction: 'left' | 'right') => {
    triggerHaptic();
    position.setValue({ x: 0, y: 0 });
    if (direction === 'right') {
      onSwipeRight();
    } else {
      onSwipeLeft();
    }
  }, [onSwipeLeft, onSwipeRight]);

  const forceSwipe = React.useCallback((direction: 'left' | 'right') => {
    const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  }, [onSwipeComplete]);

  const resetPosition = React.useCallback(() => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  }, []);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isTop,
        onMoveShouldSetPanResponder: (_, gesture) => {
          // Only respond to horizontal movements
          return isTop && (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5);
        },
        onPanResponderMove: (_, gesture) => {
          if (isTop) {
            position.setValue({ x: gesture.dx, y: gesture.dy });
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (!isTop) return;
          
          if (Math.abs(gesture.dx) < 10 && Math.abs(gesture.dy) < 10) {
            // It's a tap
            handleTap();
            resetPosition();
          } else if (gesture.dx > SWIPE_THRESHOLD) {
            forceSwipe('right');
          } else if (gesture.dx < -SWIPE_THRESHOLD) {
            forceSwipe('left');
          } else {
            resetPosition();
          }
        },
      }),
    [isTop, forceSwipe, resetPosition, handleTap]
  );

  const locationText =
    job.remote && job.location.toLowerCase().includes('remote')
      ? job.location
      : job.location || 'Not specified';
  const tags = getTags(job);

  if (!isTop) {
    // Render next card preview
    return (
      <View style={[styles.card, styles.nextCard, { zIndex: index }]}>
        <View style={styles.cardContent}>
          {/* Company Logo & Name */}
          <View style={styles.companyHeader}>
            {job.thumbnail && job.thumbnail.trim() !== '' ? (
              <View style={styles.companyLogo}>
                <Image 
                  source={{ uri: job.thumbnail }} 
                  style={styles.companyLogoImage}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={[styles.companyLogo, { backgroundColor: '#00C853' }]}>
                <Text style={styles.companyLogoText}>
                  {getCompanyLogoText(job.company)}
                </Text>
              </View>
            )}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{job.company || 'YC Startup'}</Text>
              <Text style={styles.companyCategory}>YC Startup</Text>
            </View>
          </View>
          <Text style={styles.jobTitle}>{job.title}</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.card,
        styles.topCard,
        {
          zIndex: 100,
          elevation: 100,
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.cardContent}>
        {/* Premium gradient overlay at top */}
        <View style={styles.gradientOverlay} />
        
        {/* Company Logo & Name */}
        <View style={styles.companyHeader}>
          {job.thumbnail && job.thumbnail.trim() !== '' ? (
            <View style={styles.companyLogo}>
              <Image 
                source={{ uri: job.thumbnail }} 
                style={styles.companyLogoImage}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={[styles.companyLogo, { backgroundColor: '#00C853' }]}>
              <Text style={styles.companyLogoText}>
                {getCompanyLogoText(job.company)}
              </Text>
            </View>
          )}
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{job.company || 'YC Startup'}</Text>
            <Text style={styles.companyCategory}>YC Startup</Text>
          </View>
        </View>

        {/* Match Score */}
        <View style={styles.matchBadge}>
          <Ionicons name="sparkles" size={14} color="#9B59B6" />
          <Text style={styles.matchText}>{matchScore}% Match</Text>
        </View>

        {/* Job Title */}
        <Text style={styles.jobTitle}>{job.title}</Text>

        {/* Location */}
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color="#666666" />
          <Text style={styles.infoText}>{locationText}</Text>
        </View>

        {/* Salary - Only show if available */}
        {job.salary && (
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={18} color="#666666" />
            <Text style={styles.infoText}>{job.salary}</Text>
          </View>
        )}

        {/* Company Description */}
        {job.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>"{job.description}"</Text>
          </View>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Like Overlay */}
      <Animated.View
        style={[
          styles.likeOverlay,
          { opacity: likeOpacity },
        ]}
      >
        <Text style={styles.likeText}>SAVED</Text>
      </Animated.View>

      {/* Nope Overlay */}
      <Animated.View
        style={[
          styles.nopeOverlay,
          { opacity: nopeOpacity },
        ]}
      >
        <Text style={styles.nopeText}>NOPE</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.65,
    alignSelf: 'center',
  },
  topCard: {
    zIndex: 10,
    elevation: 10,
  },
  nextCard: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
    zIndex: 1,
    elevation: 1,
  },
  cardContent: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(255, 107, 53, 0.03)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  companyLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  companyLogoImage: {
    width: '100%',
    height: '100%',
  },
  companyLogoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  companyCategory: {
    fontSize: 13,
    color: '#888888',
    fontFamily: Fonts.medium,
    letterSpacing: 0.2,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(155, 89, 182, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.2)',
  },
  matchText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#9B59B6',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  jobTitle: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: '#1A1A1A',
    marginBottom: 20,
    marginTop: 4,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 2,
  },
  infoText: {
    fontSize: 15,
    color: '#4A4A4A',
    marginLeft: 10,
    fontFamily: Fonts.medium,
  },
  descriptionContainer: {
    marginTop: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 107, 53, 0.04)',
    padding: 16,
    borderRadius: 16,
  },
  descriptionText: {
    fontSize: 15,
    color: '#4A4A4A',
    fontStyle: 'italic',
    lineHeight: 22,
    fontFamily: Fonts.regular,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 10,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tagText: {
    fontSize: 12,
    color: '#4A4A4A',
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.2,
  },
  likeOverlay: {
    position: 'absolute',
    top: 50,
    right: 30,
    borderWidth: 4,
    borderColor: '#4CAF50',
    borderRadius: 12,
    padding: 12,
    transform: [{ rotate: '20deg' }],
  },
  likeText: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: '#4CAF50',
  },
  nopeOverlay: {
    position: 'absolute',
    top: 50,
    left: 30,
    borderWidth: 4,
    borderColor: '#F44336',
    borderRadius: 12,
    padding: 12,
    transform: [{ rotate: '-20deg' }],
  },
  nopeText: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: '#F44336',
  },
});

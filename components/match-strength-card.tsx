import { colors } from '@/constants/colors';
import { Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MatchStrengthCardProps {
  matchScore: number;
  trend?: number; // Percentage change (e.g., +5 for +5%)
  status?: string; // e.g., "Ready"
  chartData?: { value: number; label?: string }[];
}

export default function MatchStrengthCard({
  matchScore,
  trend = 0,
  status = 'Ready',
  chartData,
}: MatchStrengthCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  
  // Calculate chart width: screen width - container margins (40) - container padding (40) - extra padding for labels (20)
  const chartWidth = windowWidth - 100;
  
  // Calculate spacing for 7 data points to span full width
  // spacing is the distance between data points
  // For 7 points, we need 6 gaps, so spacing = (chartWidth - initialSpacing) / 6
  const spacing = Math.max(25, (chartWidth - 10) / 6);
  
  // Use provided chart data (should always be provided from parent)
  const data = chartData || [
    { value: matchScore - 5, label: 'Mon' },
    { value: matchScore - 2, label: 'Wed' },
    { value: matchScore - 1, label: 'Fri' },
    { value: matchScore, label: 'Sun' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Internship Match Strength</Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.score}>{matchScore}%</Text>
            <Text style={styles.status}>{status}</Text>
          </View>
        </View>
        
        {/* Trend Badge */}
        {trend !== undefined && (
          <View style={styles.trendBadge}>
            <Ionicons name="arrow-up" size={12} color={colors.success} />
            <Text style={styles.trendText}>+{trend}%</Text>
          </View>
        )}
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <LineChart
          data={data}
          width={chartWidth}
          height={100}
          spacing={spacing}
          thickness={3}
          color={colors.primary}
          hideRules
          hideYAxisText
          curved
          areaChart
          startFillColor={colors.primary}
          endFillColor="rgba(255, 107, 53, 0.05)"
          startOpacity={0.6}
          endOpacity={0.05}
          initialSpacing={0}
          yAxisColor="transparent"
          xAxisColor="transparent"
          hideDataPoints={true}
          dataPointsColor={colors.primary}
          dataPointsRadius={0}
          textShiftY={-2}
          textShiftX={-5}
          textFontSize={0}
          textColor="transparent"
          rulesType="solid"
          rulesColor="transparent"
          yAxisTextStyle={{ color: 'transparent' }}
          xAxisLabelTextStyle={{
            color: colors.textTertiary,
            fontSize: 11,
            fontFamily: Fonts.regular,
          }}
          pointerConfig={{
            pointer1Color: colors.primary,
            pointerStripUptoDataPoint: true,
            pointerStripColor: colors.primary,
            pointerStripWidth: 2,
            activatePointersOnLongPress: false,
            pointerRadius: 6,
            pointerWidth: 6,
            showPointerStrip: false,
            pointerStripHeight: 120,
          }}
          isAnimated
          animationDuration={1000}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  score: {
    fontSize: 36,
    fontFamily: Fonts.bold,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  status: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: colors.textTertiary,
    marginLeft: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  trendText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: colors.success,
  },
  chartContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 140,
    paddingBottom: 20,
  },
});


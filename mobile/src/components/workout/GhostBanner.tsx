import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';
import { colors, spacing, typography } from '../../theme';
import { useGhostData } from '../../hooks/useGhostData';

export interface GhostBannerProps {
  exerciseId?: string | null;
  weightUnit?: 'kg' | 'lbs';
  currentDate?: Date; // For testing relative date calculations
}

export function formatSessionDate(isoDate?: string, baseDate: Date = new Date()): string {
  if (!isoDate) return 'Previous Session';
  try {
    const parsed = parseISO(isoDate);
    const diff = differenceInCalendarDays(baseDate, parsed);
    if (diff <= 0) return 'Today';
    if (diff <= 7) return 'Last Week';
    if (diff <= 14) return '2 Weeks Ago';
    if (diff <= 30) return `${Math.ceil(diff / 7)} Weeks Ago`;
    return format(parsed, 'MMM d');
  } catch (e) {
    return isoDate;
  }
}

export const GhostBanner: React.FC<GhostBannerProps> = ({
  exerciseId,
  weightUnit = 'kg',
  currentDate = new Date(),
}) => {
  const snapshot = useGhostData(exerciseId);

  if (!snapshot || !snapshot.sets || snapshot.sets.length === 0) {
    return (
      <View testID="ghost-banner-empty" style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>👻</Text>
        <Text style={styles.emptyText}>
          No previous data — first time logging this exercise
        </Text>
      </View>
    );
  }

  const formattedDate = formatSessionDate(snapshot.sessionDate, currentDate);

  return (
    <View testID="ghost-banner" style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.ghostIcon}>👻</Text>
          <Text style={styles.title}>Last Session ({formattedDate})</Text>
        </View>
        <Text style={styles.volumeBadge}>
          {snapshot.totalVolume} {weightUnit}
        </Text>
      </View>

      <View style={styles.setsList}>
        {snapshot.sets.map((s) => (
          <View key={s.setNumber} testID={`ghost-set-${s.setNumber}`} style={styles.setRow}>
            <Text style={styles.setText}>
              Set {s.setNumber}: {s.weight}{weightUnit} × {s.reps} @ {s.rir} RIR
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          Total Volume: {snapshot.totalVolume} {weightUnit}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ghostIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  title: {
    color: colors.primaryLight,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  volumeBadge: {
    color: colors.success,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.borderRadius.full,
  },
  setsList: {
    marginTop: spacing.xs,
  },
  setRow: {
    paddingVertical: 2,
  },
  setText: {
    color: colors.text,
    fontSize: typography.fontSizes.sm,
  },
  footerRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs,
  },
});

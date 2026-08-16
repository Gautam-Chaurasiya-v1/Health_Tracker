import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export interface ExerciseCardData {
  id: string;
  name: string;
  muscleGroup: string;
  equipment?: string;
  isCustom?: boolean;
}

export interface ExerciseCardProps {
  exercise: ExerciseCardData;
  onPress: () => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onPress }) => {
  const subtitle = exercise.equipment
    ? `${exercise.muscleGroup}  ·  ${exercise.equipment}`
    : exercise.muscleGroup;

  return (
    <TouchableOpacity
      testID={`exercise-card-${exercise.id}`}
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {exercise.isCustom && (
        <View testID="custom-badge" style={styles.customBadge}>
          <Text style={styles.customBadgeText}>Custom</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    marginBottom: 2,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    textTransform: 'capitalize',
  },
  customBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.borderRadius.full,
    marginLeft: spacing.sm,
  },
  customBadgeText: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
});

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
  onDelete?: () => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onPress, onDelete }) => {
  const subtitle = exercise.equipment
    ? `${exercise.muscleGroup}  ·  ${exercise.equipment}`
    : exercise.muscleGroup;

  return (
    <View style={styles.cardContainer}>
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

      {exercise.isCustom && onDelete && (
        <TouchableOpacity
          testID={`delete-exercise-${exercise.id}-btn`}
          style={styles.deleteBtn}
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
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
  deleteBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
});

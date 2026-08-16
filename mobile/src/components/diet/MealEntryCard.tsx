import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MealEntryEntity } from '../../../../shared/types/entities';
import { colors, spacing, typography } from '../../theme';
import { Card } from '../common';

interface MealEntryCardProps {
  meal: MealEntryEntity;
  onPress?: () => void;
  onDelete?: () => void;
  testID?: string;
}

export const MealEntryCard: React.FC<MealEntryCardProps> = ({
  meal,
  onPress,
  onDelete,
  testID,
}) => {
  return (
    <Card testID={testID} style={styles.card}>
      <TouchableOpacity
        style={styles.contentRow}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        <View style={styles.mainInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.label} numberOfLines={1}>
              {meal.label}
            </Text>
            {meal.condition_tag && (
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{meal.condition_tag.replace('_', ' ')}</Text>
              </View>
            )}
          </View>

          <View style={styles.macroRow}>
            <Text style={[styles.macroItem, { color: colors.protein }]}>
              P: {meal.protein_g}g
            </Text>
            <Text style={styles.dot}>·</Text>
            <Text style={[styles.macroItem, { color: colors.carbs }]}>
              C: {meal.carbs_g}g
            </Text>
            <Text style={styles.dot}>·</Text>
            <Text style={[styles.macroItem, { color: colors.fat }]}>
              F: {meal.fat_g}g
            </Text>
            <Text style={styles.dot}>·</Text>
            <Text style={[styles.macroItem, { color: colors.text, fontWeight: typography.fontWeights.bold }]}>
              {meal.calories} kcal
            </Text>
          </View>
        </View>

        {onDelete && (
          <TouchableOpacity
            testID={`${testID ?? 'meal-card'}-delete`}
            style={styles.deleteButton}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
    padding: spacing.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    flexShrink: 1,
  },
  tagBadge: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: spacing.borderRadius.xs,
  },
  tagText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primaryLight,
    textTransform: 'capitalize',
    fontWeight: typography.fontWeights.medium,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  macroItem: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  dot: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs,
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  deleteText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
  },
});

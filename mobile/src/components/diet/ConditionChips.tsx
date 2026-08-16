import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MealCondition } from '../../../../shared/types/enums';
import { colors, spacing, typography } from '../../theme';

interface ConditionChipsProps {
  selectedTag?: MealCondition | string | null;
  onSelectTag: (tag: MealCondition | null) => void;
  readOnly?: boolean;
}

const CONDITIONS = [
  { key: MealCondition.HighEnergy, label: '⚡ High Energy', color: '#10B981' },
  { key: MealCondition.Neutral, label: '👌 Neutral', color: '#3B82F6' },
  { key: MealCondition.Bloated, label: '🎈 Bloated', color: '#F59E0B' },
  { key: MealCondition.Sluggish, label: '🥱 Sluggish', color: '#8B5CF6' },
  { key: MealCondition.BrainFog, label: '🌫️ Brain Fog', color: '#EC4899' },
];

export const ConditionChips: React.FC<ConditionChipsProps> = ({
  selectedTag,
  onSelectTag,
  readOnly = false,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CONDITIONS.map((cond) => {
          const isSelected = selectedTag === cond.key;
          return (
            <TouchableOpacity
              key={cond.key}
              testID={`condition-chip-${cond.key}`}
              disabled={readOnly}
              onPress={() => {
                if (isSelected) {
                  onSelectTag(null); // toggle off
                } else {
                  onSelectTag(cond.key);
                }
              }}
              style={[
                styles.chip,
                isSelected && {
                  backgroundColor: `${cond.color}25`,
                  borderColor: cond.color,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && { color: cond.color, fontWeight: typography.fontWeights.bold },
                ]}
              >
                {cond.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: spacing.borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
});

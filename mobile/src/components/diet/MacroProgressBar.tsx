import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export interface MacroProgressBarProps {
  label: string;
  current: number;
  goal: number;
  unit: string;
  testID?: string;
}

export const MacroProgressBar: React.FC<MacroProgressBarProps> = ({
  label,
  current,
  goal,
  unit,
  testID,
}) => {
  const percentage = goal > 0 ? (current / goal) * 100 : 0;
  const clampedWidth = Math.min(100, Math.max(0, percentage));

  const getProgressColor = () => {
    if (percentage > 100) {
      return colors.warning; // amber/red
    }
    if (percentage >= 80) {
      return colors.success; // green
    }
    return colors.primary; // neutral / theme primary
  };

  return (
    <View testID={testID} style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valueText}>
          {current} / {goal}
          {unit ? ` ${unit}` : ''}
        </Text>
      </View>

      <View style={styles.track}>
        <View
          testID={`${testID ?? 'macro-bar'}-fill`}
          style={[
            styles.fill,
            {
              width: `${clampedWidth}%`,
              backgroundColor: getProgressColor(),
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
  },
  valueText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  track: {
    height: 8,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: spacing.borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: spacing.borderRadius.full,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export interface SetRowData {
  setNumber: number;
  weight: number;
  reps: number;
  rir: number;
  notes?: string;
}

export interface SetRowProps {
  set: SetRowData;
  weightUnit?: 'kg' | 'lbs';
}

export const SetRow: React.FC<SetRowProps> = ({ set, weightUnit = 'kg' }) => {
  return (
    <View testID={`set-row-${set.setNumber}`} style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>#{set.setNumber}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.mainText}>
          Set {set.setNumber} — {set.weight} {weightUnit} × {set.reps} reps @ {set.rir} RIR
        </Text>
        {set.notes ? <Text style={styles.notesText}>{set.notes}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.sm,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  badgeText: {
    color: colors.primary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  content: {
    flex: 1,
  },
  mainText: {
    color: colors.text,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
  notesText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
});

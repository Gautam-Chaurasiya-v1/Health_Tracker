import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../../theme';

interface UnitStepProps {
  unit: 'kg' | 'lbs';
  onChangeUnit: (unit: 'kg' | 'lbs') => void;
}

export const UnitStep: React.FC<UnitStepProps> = ({ unit, onChangeUnit }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Choose Your Unit</Text>
      <Text style={styles.subheading}>
        Select your preferred weight unit. This will be used across your workouts, weight tracking, and macro targets.
      </Text>

      <View style={styles.optionsRow}>
        <TouchableOpacity
          testID="unit-option-kg"
          style={[styles.unitCard, unit === 'kg' && styles.unitCardSelected]}
          onPress={() => onChangeUnit('kg')}
          activeOpacity={0.7}
        >
          <Text style={[styles.unitTitle, unit === 'kg' && styles.unitTitleSelected]}>
            Kilograms
          </Text>
          <Text style={[styles.unitSymbol, unit === 'kg' && styles.unitSymbolSelected]}>
            kg
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="unit-option-lbs"
          style={[styles.unitCard, unit === 'lbs' && styles.unitCardSelected]}
          onPress={() => onChangeUnit('lbs')}
          activeOpacity={0.7}
        >
          <Text style={[styles.unitTitle, unit === 'lbs' && styles.unitTitleSelected]}>
            Pounds
          </Text>
          <Text style={[styles.unitSymbol, unit === 'lbs' && styles.unitSymbolSelected]}>
            lbs
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  heading: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subheading: {
    fontSize: typography.fontSizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  unitCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceHighlight,
  },
  unitTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  unitTitleSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  unitSymbol: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  unitSymbolSelected: {
    color: colors.text,
  },
});

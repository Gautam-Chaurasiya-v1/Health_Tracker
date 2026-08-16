import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface StepperProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  style?: ViewStyle;
  testID?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  unit,
  style,
  testID,
}) => {
  const handleDecrement = () => {
    const nextVal = Math.max(min, value - step);
    onChange(nextVal);
  };

  const handleIncrement = () => {
    const nextVal = Math.min(max, value + step);
    onChange(nextVal);
  };

  return (
    <View testID={testID} style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.stepperControl}>
        <TouchableOpacity
          testID={`${testID ?? 'stepper'}-dec`}
          onPress={handleDecrement}
          disabled={value <= min}
          style={[styles.button, value <= min && styles.buttonDisabled]}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, value <= min && styles.buttonTextDisabled]}>−</Text>
        </TouchableOpacity>

        <View style={styles.valueContainer}>
          <Text style={styles.valueText}>
            {value}
            {unit ? ` ${unit}` : ''}
          </Text>
        </View>

        <TouchableOpacity
          testID={`${testID ?? 'stepper'}-inc`}
          onPress={handleIncrement}
          disabled={value >= max}
          style={[styles.button, value >= max && styles.buttonDisabled]}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, value >= max && styles.buttonTextDisabled]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    marginBottom: spacing.xs,
  },
  stepperControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
  },
  button: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    color: colors.text,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
  },
  buttonTextDisabled: {
    color: colors.textMuted,
  },
  valueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    color: colors.text,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
});

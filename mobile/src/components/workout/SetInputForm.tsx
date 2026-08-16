import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Stepper } from '../common/Stepper';

export interface SetInputFormProps {
  previousSet?: { weight: number; reps: number; rir: number } | null;
  weightUnit?: 'kg' | 'lbs';
  onConfirm: (data: { weight: number; reps: number; rir: number }) => void;
}

export const SetInputForm: React.FC<SetInputFormProps> = ({
  previousSet,
  weightUnit = 'kg',
  onConfirm,
}) => {
  const [weight, setWeight] = useState<number>(previousSet?.weight ?? 0);
  const [reps, setReps] = useState<number>(previousSet?.reps ?? 5);
  const [rir, setRir] = useState<number>(previousSet?.rir ?? 2);

  const lastConfirmTimeRef = useRef<number>(0);

  useEffect(() => {
    if (previousSet) {
      setWeight(previousSet.weight);
      setReps(previousSet.reps);
      setRir(previousSet.rir);
    }
  }, [previousSet]);

  const handleQuickWeightAdjust = (delta: number) => {
    setWeight((prev) => Math.max(0, Math.round((prev + delta) * 10) / 10));
  };

  const handleWeightInputChange = (text: string) => {
    const numeric = parseFloat(text.replace(/[^0-9.]/g, ''));
    setWeight(isNaN(numeric) ? 0 : numeric);
  };

  const handleConfirm = () => {
    const now = Date.now();
    if (now - lastConfirmTimeRef.current < 300) {
      return; // Debounce rapid taps
    }
    lastConfirmTimeRef.current = now;

    if (weight <= 0) return;

    onConfirm({
      weight,
      reps,
      rir,
    });
  };

  const stepDelta = weightUnit === 'lbs' ? 5 : 2.5;

  return (
    <View testID="set-input-form" style={styles.container}>
      <Text style={styles.title}>Log Set</Text>

      {/* Weight Input Row */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Weight ({weightUnit})</Text>
        <View style={styles.weightRow}>
          <TouchableOpacity
            testID="weight-dec-btn"
            style={styles.quickButton}
            onPress={() => handleQuickWeightAdjust(-stepDelta)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickButtonText}>−{stepDelta}</Text>
          </TouchableOpacity>

          <TextInput
            testID="weight-input"
            style={styles.weightInput}
            keyboardType="decimal-pad"
            value={weight === 0 ? '' : weight.toString()}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            onChangeText={handleWeightInputChange}
          />

          <TouchableOpacity
            testID="weight-inc-btn"
            style={styles.quickButton}
            onPress={() => handleQuickWeightAdjust(stepDelta)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickButtonText}>+{stepDelta}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reps Stepper */}
      <Stepper
        testID="reps-stepper"
        value={reps}
        min={1}
        max={100}
        step={1}
        label="Reps"
        onChange={setReps}
      />

      {/* RIR Stepper */}
      <Stepper
        testID="rir-stepper"
        value={rir}
        min={0}
        max={5}
        step={1}
        label="Reps in Reserve (RIR 0–5)"
        onChange={setRir}
      />

      {/* Confirm Button */}
      <TouchableOpacity
        testID="confirm-set-btn"
        style={[styles.confirmButton, weight <= 0 && styles.confirmButtonDisabled]}
        onPress={handleConfirm}
        disabled={weight <= 0}
        activeOpacity={0.8}
      >
        <Text style={[styles.confirmButtonText, weight <= 0 && styles.confirmButtonTextDisabled]}>
          ✓ Log Set
        </Text>
      </TouchableOpacity>
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
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    marginBottom: spacing.xs,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickButton: {
    backgroundColor: colors.surfaceHighlight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickButtonText: {
    color: colors.primary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  weightInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.md,
    color: colors.text,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.surfaceHighlight,
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#000000',
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  confirmButtonTextDisabled: {
    color: colors.textMuted,
  },
});

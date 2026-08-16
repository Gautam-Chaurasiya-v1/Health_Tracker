import React from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../../../theme';
import { Button } from '../../../components/common';

interface GoalsStepProps {
  weightUnit: 'kg' | 'lbs';
  bodyWeight: number;
  proteinGoal: number;
  carbsGoal: number;
  fatsGoal: number;
  caloriesGoal: number;
  onChangeBodyWeight: (val: number) => void;
  onChangeProtein: (val: number) => void;
  onChangeCarbs: (val: number) => void;
  onChangeFats: (val: number) => void;
  onChangeCalories: (val: number) => void;
  onResetDefaults: () => void;
}

export const GoalsStep: React.FC<GoalsStepProps> = ({
  weightUnit,
  bodyWeight,
  proteinGoal,
  carbsGoal,
  fatsGoal,
  caloriesGoal,
  onChangeBodyWeight,
  onChangeProtein,
  onChangeCarbs,
  onChangeFats,
  onChangeCalories,
  onResetDefaults,
}) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Set Your Targets</Text>
      <Text style={styles.subheading}>
        Enter your current body weight to generate recommended daily macro targets, or customize them manually.
      </Text>

      {/* Body Weight Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Current Body Weight ({weightUnit})</Text>
        <TextInput
          testID="bodyweight-input"
          style={styles.input}
          keyboardType="numeric"
          value={bodyWeight ? String(bodyWeight) : ''}
          onChangeText={(txt) => {
            const num = parseFloat(txt) || 0;
            onChangeBodyWeight(num);
          }}
          placeholder={`e.g. ${weightUnit === 'kg' ? '75' : '165'}`}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.recalcRow}>
        <Text style={styles.sectionTitle}>Daily Macro Goals</Text>
        <Button
          testID="recalc-defaults-btn"
          title="Reset to Smart Defaults"
          variant="ghost"
          style={styles.resetButton}
          textStyle={styles.resetButtonText}
          onPress={onResetDefaults}
        />
      </View>

      {/* Calories */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Calories (kcal)</Text>
        <TextInput
          testID="calories-goal-input"
          style={styles.input}
          keyboardType="numeric"
          value={caloriesGoal ? String(caloriesGoal) : ''}
          onChangeText={(txt) => onChangeCalories(parseInt(txt, 10) || 0)}
          placeholder="2000"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Protein */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.protein }]}>Protein (g)</Text>
        <TextInput
          testID="protein-goal-input"
          style={styles.input}
          keyboardType="numeric"
          value={proteinGoal ? String(proteinGoal) : ''}
          onChangeText={(txt) => onChangeProtein(parseInt(txt, 10) || 0)}
          placeholder="160"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Carbs */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.carbs }]}>Carbohydrates (g)</Text>
        <TextInput
          testID="carbs-goal-input"
          style={styles.input}
          keyboardType="numeric"
          value={carbsGoal ? String(carbsGoal) : ''}
          onChangeText={(txt) => onChangeCarbs(parseInt(txt, 10) || 0)}
          placeholder="200"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Fats */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.fat }]}>Fats (g)</Text>
        <TextInput
          testID="fats-goal-input"
          style={styles.input}
          keyboardType="numeric"
          value={fatsGoal ? String(fatsGoal) : ''}
          onChangeText={(txt) => onChangeFats(parseInt(txt, 10) || 0)}
          placeholder="60"
          placeholderTextColor={colors.textMuted}
        />
      </View>
    </ScrollView>
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
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.md,
    height: 48,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: typography.fontSizes.md,
  },
  recalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  resetButton: {
    height: 32,
    paddingHorizontal: spacing.sm,
  },
  resetButtonText: {
    fontSize: typography.fontSizes.xs,
  },
});

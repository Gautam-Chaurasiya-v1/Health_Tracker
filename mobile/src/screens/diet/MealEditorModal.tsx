import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { Button, Header } from '../../components/common';
import { ConditionChips } from '../../components/diet/ConditionChips';
import { useDietStore, calculateMealCalories } from '../../stores/useDietStore';
import { MealCondition } from '../../../../shared/types/enums';

type RouteProps = RouteProp<RootStackParamList, 'MealEditor'>;

interface MealEditorModalProps {
  visible?: boolean;
  onClose?: () => void;
  initialMeal?: any;
}

export const MealEditorModal: React.FC<MealEditorModalProps> = ({
  visible = true,
  onClose,
  initialMeal,
}) => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const addMeal = useDietStore((s) => s.addMeal);
  const updateMeal = useDietStore((s) => s.updateMeal);
  const meals = useDietStore((s) => s.meals);

  const mealId = route.params?.mealId;
  const existingMeal = initialMeal || (mealId ? meals.find((m) => m.id === mealId) : null);

  const [label, setLabel] = useState<string>(existingMeal?.label || '');
  const [protein, setProtein] = useState<string>(
    existingMeal ? String(existingMeal.protein_g) : ''
  );
  const [carbs, setCarbs] = useState<string>(
    existingMeal ? String(existingMeal.carbs_g) : ''
  );
  const [fat, setFat] = useState<string>(
    existingMeal ? String(existingMeal.fat_g) : ''
  );
  const [calories, setCalories] = useState<string>(
    existingMeal ? String(existingMeal.calories) : ''
  );
  const [isCaloriesOverridden, setIsCaloriesOverridden] = useState<boolean>(false);
  const [conditionTag, setConditionTag] = useState<MealCondition | null>(
    existingMeal?.condition_tag || null
  );

  // Auto-calculate calories when macros change, unless overridden
  useEffect(() => {
    if (!isCaloriesOverridden) {
      const p = parseFloat(protein) || 0;
      const c = parseFloat(carbs) || 0;
      const f = parseFloat(fat) || 0;
      const autoCal = calculateMealCalories(p, c, f);
      setCalories(autoCal > 0 ? String(autoCal) : '');
    }
  }, [protein, carbs, fat, isCaloriesOverridden]);

  const handleSave = async () => {
    if (!label.trim()) {
      Alert.alert('Label Required', 'Please enter a meal name (e.g. Breakfast Oats, Post-workout Shake).');
      return;
    }

    const p = parseFloat(protein) || 0;
    const c = parseFloat(carbs) || 0;
    const f = parseFloat(fat) || 0;
    const cal = parseFloat(calories) || calculateMealCalories(p, c, f);

    try {
      if (existingMeal?.id) {
        await updateMeal(existingMeal.id, {
          label: label.trim(),
          protein_g: p,
          carbs_g: c,
          fat_g: f,
          calories: cal,
          condition_tag: conditionTag,
        });
      } else {
        await addMeal({
          label: label.trim(),
          protein_g: p,
          carbs_g: c,
          fat_g: f,
          calories: cal,
          condition_tag: conditionTag,
        });
      }

      if (onClose) {
        onClose();
      } else {
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save meal entry.');
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={existingMeal ? 'Edit Meal' : 'Log Meal'}
        leftAction={{ label: 'Cancel', onPress: handleCancel }}
        rightAction={{ label: 'Save', onPress: handleSave }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Meal Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Meal Description</Text>
          <TextInput
            testID="meal-label-input"
            style={styles.input}
            placeholder="e.g. Grilled Chicken & Rice"
            placeholderTextColor={colors.textMuted}
            value={label}
            onChangeText={setLabel}
            autoFocus={!existingMeal}
          />
        </View>

        {/* Condition Tag */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>How did you feel after this meal?</Text>
          <ConditionChips
            selectedTag={conditionTag}
            onSelectTag={setConditionTag}
          />
        </View>

        <Text style={styles.sectionTitle}>Macros Breakdown</Text>

        {/* Protein */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.protein }]}>Protein (g)</Text>
          <TextInput
            testID="meal-protein-input"
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            value={protein}
            onChangeText={setProtein}
          />
        </View>

        {/* Carbs */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.carbs }]}>Carbohydrates (g)</Text>
          <TextInput
            testID="meal-carbs-input"
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            value={carbs}
            onChangeText={setCarbs}
          />
        </View>

        {/* Fat */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.fat }]}>Fat (g)</Text>
          <TextInput
            testID="meal-fat-input"
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            value={fat}
            onChangeText={setFat}
          />
        </View>

        {/* Calories */}
        <View style={styles.inputGroup}>
          <View style={styles.caloriesLabelRow}>
            <Text style={[styles.label, { color: colors.calories }]}>Total Calories (kcal)</Text>
            {isCaloriesOverridden && (
              <Text style={styles.overrideBadge}>(Custom Override)</Text>
            )}
          </View>
          <TextInput
            testID="meal-calories-input"
            style={styles.input}
            keyboardType="numeric"
            placeholder="Auto-calculated"
            placeholderTextColor={colors.textMuted}
            value={calories}
            onChangeText={(txt) => {
              setIsCaloriesOverridden(true);
              setCalories(txt);
            }}
          />
        </View>

        <Button
          testID="save-meal-btn"
          title={existingMeal ? 'Update Meal' : 'Add Meal'}
          style={styles.saveButton}
          onPress={handleSave}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
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
  sectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  caloriesLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  overrideBadge: {
    fontSize: typography.fontSizes.xs,
    color: colors.warning,
  },
  saveButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});

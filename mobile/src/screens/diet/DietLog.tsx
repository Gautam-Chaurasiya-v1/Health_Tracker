import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { Card, Button } from '../../components/common';
import { MacroProgressBar } from '../../components/diet/MacroProgressBar';
import { MealEntryCard } from '../../components/diet/MealEntryCard';
import { useDietStore } from '../../stores/useDietStore';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { useMacroSummary } from '../../hooks/useMacroSummary';
import { format, addDays, subDays, parseISO } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DietLog: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const selectedDate = useDietStore((s) => s.selectedDate);
  const setSelectedDate = useDietStore((s) => s.setSelectedDate);
  const loadDietDay = useDietStore((s) => s.loadDietDay);
  const saveBodyWeight = useDietStore((s) => s.saveBodyWeight);
  const bodyWeight = useDietStore((s) => s.bodyWeight);
  const deleteMeal = useDietStore((s) => s.deleteMeal);
  const meals = useDietStore((s) => s.meals);

  const weightUnit = usePreferencesStore((s) => s.weightUnit);
  const { totals, goals } = useMacroSummary();

  const [weightInput, setWeightInput] = useState<string>(
    bodyWeight ? String(bodyWeight) : ''
  );

  useEffect(() => {
    loadDietDay(selectedDate);
  }, [selectedDate, loadDietDay]);

  useEffect(() => {
    setWeightInput(bodyWeight ? String(bodyWeight) : '');
  }, [bodyWeight]);

  const handlePrevDay = () => {
    const prev = format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    setSelectedDate(next);
  };

  const handleSaveWeight = async () => {
    const num = parseFloat(weightInput);
    if (!isNaN(num) && num > 0 && num <= 500) {
      await saveBodyWeight(num, weightUnit as any);
      Alert.alert('Saved', `Body weight logged as ${num} ${weightUnit}.`);
    } else if (weightInput.trim() !== '') {
      Alert.alert('Invalid Weight', 'Please enter a valid weight between 0 and 500.');
    }
  };

  const handleDeleteMeal = (mealId: string, label: string) => {
    Alert.alert('Delete Meal', `Remove "${label}" from today's log?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMeal(mealId),
      },
    ]);
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const formattedDateTitle = isToday
    ? `Today, ${format(parseISO(selectedDate), 'MMM d')}`
    : format(parseISO(selectedDate), 'EEE, MMM d, yyyy');

  return (
    <SafeAreaView style={styles.container}>
      {/* Date Header */}
      <View style={styles.dateHeader}>
        <TouchableOpacity
          testID="prev-date-btn"
          onPress={handlePrevDay}
          style={styles.dateNavButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.dateNavArrow}>◀</Text>
        </TouchableOpacity>

        <Text testID="date-display" style={styles.dateTitle}>
          {formattedDateTitle}
        </Text>

        <TouchableOpacity
          testID="next-date-btn"
          onPress={handleNextDay}
          style={styles.dateNavButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.dateNavArrow}>▶</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Body Weight Widget */}
        <Card style={styles.weightCard}>
          <View style={styles.weightRow}>
            <View style={styles.weightLabelContainer}>
              <Text style={styles.weightTitle}>Body Weight</Text>
              <Text style={styles.weightSubtitle}>Daily weigh-in ({weightUnit})</Text>
            </View>
            <View style={styles.weightInputGroup}>
              <TextInput
                testID="weight-input"
                style={styles.weightInput}
                keyboardType="numeric"
                placeholder="--"
                placeholderTextColor={colors.textMuted}
                value={weightInput}
                onChangeText={setWeightInput}
                onBlur={handleSaveWeight}
              />
              <TouchableOpacity
                testID="save-weight-btn"
                onPress={handleSaveWeight}
                style={styles.saveWeightButton}
              >
                <Text style={styles.saveWeightText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Macro Summary Progress Bars */}
        <Card style={styles.macrosCard}>
          <Text style={styles.cardHeader}>Daily Nutrition Goals</Text>
          <MacroProgressBar
            testID="calories-progress"
            label="Calories"
            current={totals.calories}
            goal={goals.calories}
            unit="kcal"
          />
          <MacroProgressBar
            testID="protein-progress"
            label="Protein"
            current={totals.protein}
            goal={goals.protein}
            unit="g"
          />
          <MacroProgressBar
            testID="carbs-progress"
            label="Carbohydrates"
            current={totals.carbs}
            goal={goals.carbs}
            unit="g"
          />
          <MacroProgressBar
            testID="fat-progress"
            label="Fat"
            current={totals.fat}
            goal={goals.fat}
            unit="g"
          />
        </Card>

        {/* Meals List */}
        <View style={styles.mealsHeaderRow}>
          <Text style={styles.sectionTitle}>Meals Logged ({meals.length})</Text>
          <Button
            testID="add-meal-btn"
            title="+ Add Meal"
            variant="primary"
            style={styles.addMealButton}
            textStyle={styles.addMealButtonText}
            onPress={() =>
              navigation.navigate('MealEditor', {
                dietLogId: selectedDate,
              })
            }
          />
        </View>

        {meals.length === 0 ? (
          <Card testID="empty-meals-state" style={styles.emptyStateCard}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No meals logged yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "+ Add Meal" to track your nutrition for this day.
            </Text>
          </Card>
        ) : (
          meals.map((meal) => (
            <MealEntryCard
              key={meal.id}
              testID={`meal-card-${meal.id}`}
              meal={meal}
              onPress={() =>
                navigation.navigate('MealEditor', {
                  mealId: meal.id,
                  dietLogId: selectedDate,
                })
              }
              onDelete={() => handleDeleteMeal(meal.id, meal.label)}
            />
          ))
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateNavButton: {
    padding: spacing.xs,
  },
  dateNavArrow: {
    color: colors.primary,
    fontSize: typography.fontSizes.lg,
  },
  dateTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  weightCard: {
    marginBottom: spacing.md,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weightLabelContainer: {
    flex: 1,
  },
  weightTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  weightSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  weightInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  weightInput: {
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.sm,
    width: 72,
    height: 38,
    textAlign: 'center',
    color: colors.text,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
  saveWeightButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 2,
    height: 38,
    borderRadius: spacing.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveWeightText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  macrosCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  mealsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  addMealButton: {
    height: 36,
    paddingHorizontal: spacing.md,
  },
  addMealButtonText: {
    fontSize: typography.fontSizes.sm,
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

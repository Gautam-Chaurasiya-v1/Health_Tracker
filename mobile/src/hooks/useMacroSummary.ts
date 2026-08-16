import { useMemo } from 'react';
import { useDietStore } from '../stores/useDietStore';
import { usePreferencesStore } from '../stores/usePreferencesStore';

export const useMacroSummary = () => {
  const meals = useDietStore((s) => s.meals);
  const proteinGoal = usePreferencesStore((s) => s.proteinGoalG);
  const carbsGoal = usePreferencesStore((s) => s.carbsGoalG);
  const fatsGoal = usePreferencesStore((s) => s.fatsGoalG);
  const caloriesGoal = usePreferencesStore((s) => s.caloriesGoal);

  const totals = useMemo(() => {
    return meals.reduce(
      (acc, meal) => ({
        protein: acc.protein + (meal.protein_g || 0),
        carbs: acc.carbs + (meal.carbs_g || 0),
        fat: acc.fat + (meal.fat_g || 0),
        calories: acc.calories + (meal.calories || 0),
      }),
      { protein: 0, carbs: 0, fat: 0, calories: 0 }
    );
  }, [meals]);

  const percentages = useMemo(() => {
    return {
      protein: proteinGoal > 0 ? Math.round((totals.protein / proteinGoal) * 100) : 0,
      carbs: carbsGoal > 0 ? Math.round((totals.carbs / carbsGoal) * 100) : 0,
      fat: fatsGoal > 0 ? Math.round((totals.fat / fatsGoal) * 100) : 0,
      calories: caloriesGoal > 0 ? Math.round((totals.calories / caloriesGoal) * 100) : 0,
    };
  }, [totals, proteinGoal, carbsGoal, fatsGoal, caloriesGoal]);

  return {
    totals,
    goals: {
      protein: proteinGoal,
      carbs: carbsGoal,
      fat: fatsGoal,
      calories: caloriesGoal,
    },
    percentages,
  };
};

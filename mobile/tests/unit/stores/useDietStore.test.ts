import { useDietStore, calculateMealCalories } from '../../../src/stores/useDietStore';
import { database } from '../../../src/db';
import { MealCondition, WeightUnit } from '../../../../shared/types/enums';

describe('useDietStore', () => {
  beforeEach(async () => {
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    useDietStore.setState({
      selectedDate: '2026-08-16',
      currentDietLog: null,
      meals: [],
      bodyWeight: null,
      weightUnit: WeightUnit.Kg,
      isLoading: false,
    });
  });

  it('calculates calories from protein, carbs, and fat correctly', () => {
    // 30g P * 4 + 40g C * 4 + 10g F * 9 = 120 + 160 + 90 = 370 kcal
    expect(calculateMealCalories(30, 40, 10)).toBe(370);
  });

  it('saves body weight to database and updates store', async () => {
    await useDietStore.getState().saveBodyWeight(82.5, WeightUnit.Kg);

    const state = useDietStore.getState();
    expect(state.bodyWeight).toBe(82.5);
    expect(state.currentDietLog?.body_weight).toBe(82.5);

    const logs = await database.get('diet_logs').query().fetch();
    expect(logs.length).toBe(1);
    expect((logs[0] as any).bodyWeight).toBe(82.5);
  });

  it('adds meal, computes daily totals, and deletes meal', async () => {
    const meal = await useDietStore.getState().addMeal({
      label: 'Breakfast Bowl',
      protein_g: 40,
      carbs_g: 50,
      fat_g: 10,
      condition_tag: MealCondition.HighEnergy,
    });

    expect(meal.label).toBe('Breakfast Bowl');
    expect(meal.calories).toBe(450); // 40*4 + 50*4 + 10*9 = 160 + 200 + 90 = 450

    let totals = useDietStore.getState().getDailyTotals();
    expect(totals.protein).toBe(40);
    expect(totals.carbs).toBe(50);
    expect(totals.fat).toBe(10);
    expect(totals.calories).toBe(450);

    // Delete meal
    await useDietStore.getState().deleteMeal(meal.id);
    totals = useDietStore.getState().getDailyTotals();
    expect(totals.calories).toBe(0);
    expect(useDietStore.getState().meals.length).toBe(0);
  });
});

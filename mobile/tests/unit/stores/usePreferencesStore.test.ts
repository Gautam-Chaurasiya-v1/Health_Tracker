import { usePreferencesStore, calculateMacroDefaults } from '../../../src/stores/usePreferencesStore';
import { database } from '../../../src/db';

describe('usePreferencesStore', () => {
  beforeEach(async () => {
    // Reset database state before each test
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    usePreferencesStore.setState({
      displayName: '',
      weightUnit: 'kg',
      bodyWeight: 75,
      proteinGoalG: 165,
      carbsGoalG: 200,
      fatsGoalG: 60,
      caloriesGoal: 2000,
      onboardingComplete: false,
      isLoading: false,
    });
  });

  it('calculates macro defaults correctly for kg and lbs', () => {
    // 75 kg = ~165 lbs
    const kgDefaults = calculateMacroDefaults(75, 'kg');
    expect(kgDefaults.protein).toBeGreaterThan(150);
    expect(kgDefaults.calories).toBeGreaterThan(2000);
    expect(kgDefaults.carbs).toBeGreaterThan(0);
    expect(kgDefaults.fat).toBeGreaterThan(0);

    // 165 lbs
    const lbsDefaults = calculateMacroDefaults(165, 'lbs');
    expect(lbsDefaults.protein).toBe(165);
    expect(lbsDefaults.calories).toBe(165 * 15);
  });

  it('saves preferences and marks onboarding_complete on completeOnboarding', async () => {
    await usePreferencesStore.getState().completeOnboarding({
      displayName: 'Alex',
      weightUnit: 'kg',
      bodyWeight: 80,
      proteinGoalG: 175,
      carbsGoalG: 220,
      fatsGoalG: 65,
      caloriesGoal: 2165,
    });

    const state = usePreferencesStore.getState();
    expect(state.displayName).toBe('Alex');
    expect(state.onboardingComplete).toBe(true);
    expect(state.proteinGoalG).toBe(175);

    // Verify written to database
    const records = await database.get('user_preferences').query().fetch();
    expect(records.length).toBe(1);
    expect((records[0] as any).displayName).toBe('Alex');
    expect((records[0] as any).onboardingComplete).toBe(true);
  });

  it('updates preferences without losing other values', async () => {
    await usePreferencesStore.getState().completeOnboarding({
      displayName: 'Alex',
      weightUnit: 'kg',
      bodyWeight: 80,
      proteinGoalG: 175,
      carbsGoalG: 220,
      fatsGoalG: 65,
      caloriesGoal: 2165,
    });

    await usePreferencesStore.getState().updatePreferences({
      weightUnit: 'lbs',
    });

    const state = usePreferencesStore.getState();
    expect(state.weightUnit).toBe('lbs');
    expect(state.displayName).toBe('Alex');
    expect(state.proteinGoalG).toBe(175);
  });
});

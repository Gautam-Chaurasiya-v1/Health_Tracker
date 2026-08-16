import { create } from 'zustand';
import { database } from '../db';
import UserPreferences from '../db/models/UserPreferences';

export interface PreferencesState {
  displayName: string;
  weightUnit: 'kg' | 'lbs';
  bodyWeight: number;
  proteinGoalG: number;
  carbsGoalG: number;
  fatsGoalG: number;
  caloriesGoal: number;
  onboardingComplete: boolean;
  isLoading: boolean;

  // Actions
  loadPreferences: () => Promise<void>;
  calculateDefaults: (bodyWeight: number, unit: 'kg' | 'lbs') => {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
  };
  updatePreferences: (data: {
    displayName?: string;
    weightUnit?: 'kg' | 'lbs';
    bodyWeight?: number;
    proteinGoalG?: number;
    carbsGoalG?: number;
    fatsGoalG?: number;
    caloriesGoal?: number;
  }) => Promise<void>;
  completeOnboarding: (data: {
    displayName: string;
    weightUnit: 'kg' | 'lbs';
    bodyWeight: number;
    proteinGoalG: number;
    carbsGoalG: number;
    fatsGoalG: number;
    caloriesGoal: number;
  }) => Promise<void>;
}

export const calculateMacroDefaults = (bodyWeight: number, unit: 'kg' | 'lbs') => {
  const weightInLbs = unit === 'kg' ? bodyWeight * 2.20462 : bodyWeight;
  const protein = Math.round(weightInLbs * 1.0); // 1g per lb
  const calories = Math.round(weightInLbs * 15); // 15 kcal per lb
  const caloriesAfterProtein = Math.max(0, calories - protein * 4);
  const carbs = Math.round((caloriesAfterProtein * 0.55) / 4);
  const fat = Math.round((caloriesAfterProtein * 0.45) / 9);

  return {
    protein: Math.max(0, protein),
    carbs: Math.max(0, carbs),
    fat: Math.max(0, fat),
    calories: Math.max(0, calories),
  };
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  displayName: '',
  weightUnit: 'kg',
  bodyWeight: 75,
  proteinGoalG: 165,
  carbsGoalG: 200,
  fatsGoalG: 60,
  caloriesGoal: 2000,
  onboardingComplete: false,
  isLoading: false,

  calculateDefaults: (bodyWeight: number, unit: 'kg' | 'lbs') => {
    return calculateMacroDefaults(bodyWeight, unit);
  },

  loadPreferences: async () => {
    set({ isLoading: true });
    try {
      const records = await database.get<UserPreferences>('user_preferences').query().fetch();
      if (records.length > 0) {
        const pref = records[0];
        set({
          displayName: pref.displayName,
          weightUnit: pref.weightUnit,
          proteinGoalG: pref.proteinGoalG,
          carbsGoalG: pref.carbsGoalG,
          fatsGoalG: pref.fatsGoalG,
          caloriesGoal: pref.caloriesGoal,
          onboardingComplete: pref.onboardingComplete,
        });
      }
    } catch (err) {
      console.error('Error loading preferences from DB:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  updatePreferences: async (data) => {
    set(data);
    await database.write(async () => {
      const records = await database.get<UserPreferences>('user_preferences').query().fetch();
      if (records.length > 0) {
        await records[0].update((record) => {
          if (data.displayName !== undefined) record.displayName = data.displayName;
          if (data.weightUnit !== undefined) record.weightUnit = data.weightUnit;
          if (data.proteinGoalG !== undefined) record.proteinGoalG = data.proteinGoalG;
          if (data.carbsGoalG !== undefined) record.carbsGoalG = data.carbsGoalG;
          if (data.fatsGoalG !== undefined) record.fatsGoalG = data.fatsGoalG;
          if (data.caloriesGoal !== undefined) record.caloriesGoal = data.caloriesGoal;
          record.updatedAt = new Date();
        });
      } else {
        await database.get<UserPreferences>('user_preferences').create((record) => {
          record.displayName = data.displayName ?? get().displayName ?? 'Athlete';
          record.weightUnit = data.weightUnit ?? get().weightUnit;
          record.proteinGoalG = data.proteinGoalG ?? get().proteinGoalG;
          record.carbsGoalG = data.carbsGoalG ?? get().carbsGoalG;
          record.fatsGoalG = data.fatsGoalG ?? get().fatsGoalG;
          record.caloriesGoal = data.caloriesGoal ?? get().caloriesGoal;
          record.onboardingComplete = false;
          record.updatedAt = new Date();
        });
      }
    });
  },

  completeOnboarding: async (data) => {
    set({
      ...data,
      onboardingComplete: true,
    });

    await database.write(async () => {
      const records = await database.get<UserPreferences>('user_preferences').query().fetch();
      if (records.length > 0) {
        await records[0].update((record) => {
          record.displayName = data.displayName;
          record.weightUnit = data.weightUnit;
          record.proteinGoalG = data.proteinGoalG;
          record.carbsGoalG = data.carbsGoalG;
          record.fatsGoalG = data.fatsGoalG;
          record.caloriesGoal = data.caloriesGoal;
          record.onboardingComplete = true;
          record.updatedAt = new Date();
        });
      } else {
        await database.get<UserPreferences>('user_preferences').create((record) => {
          record.displayName = data.displayName;
          record.weightUnit = data.weightUnit;
          record.proteinGoalG = data.proteinGoalG;
          record.carbsGoalG = data.carbsGoalG;
          record.fatsGoalG = data.fatsGoalG;
          record.caloriesGoal = data.caloriesGoal;
          record.onboardingComplete = true;
          record.updatedAt = new Date();
        });
      }
    });
  },
}));

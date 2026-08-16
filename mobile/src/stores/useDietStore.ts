import { create } from 'zustand';
import { database } from '../db';
import DietLog from '../db/models/DietLog';
import MealEntry from '../db/models/MealEntry';
import { MealCondition, SyncStatus, WeightUnit } from '../../../shared/types/enums';
import { DietLogEntity, MealEntryEntity } from '../../../shared/types/entities';
import uuid from 'react-native-uuid';
import { format } from 'date-fns';

export interface DietState {
  selectedDate: string; // YYYY-MM-DD
  currentDietLog: DietLogEntity | null;
  meals: MealEntryEntity[];
  bodyWeight: number | null;
  weightUnit: WeightUnit;
  isLoading: boolean;

  // Actions
  setSelectedDate: (date: string) => Promise<void>;
  loadDietDay: (dateStr?: string) => Promise<void>;
  saveBodyWeight: (weight: number, unit?: WeightUnit) => Promise<void>;
  addMeal: (data: {
    label: string;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    calories?: number;
    condition_tag?: MealCondition | null;
    meal_photo_id?: string | null;
  }) => Promise<MealEntryEntity>;
  updateMeal: (
    mealId: string,
    data: {
      label?: string;
      protein_g?: number;
      carbs_g?: number;
      fat_g?: number;
      calories?: number;
      condition_tag?: MealCondition | null;
      meal_photo_id?: string | null;
    }
  ) => Promise<void>;
  deleteMeal: (mealId: string) => Promise<void>;
  getDailyTotals: () => {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
  };
}

export const calculateMealCalories = (p: number, c: number, f: number): number => {
  return Math.max(0, Math.round(p * 4 + c * 4 + f * 9));
};

export const useDietStore = create<DietState>((set, get) => ({
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  currentDietLog: null,
  meals: [],
  bodyWeight: null,
  weightUnit: WeightUnit.Kg,
  isLoading: false,

  setSelectedDate: async (date: string) => {
    set({ selectedDate: date });
    await get().loadDietDay(date);
  },

  loadDietDay: async (dateStr?: string) => {
    const targetDate = dateStr ?? get().selectedDate;
    set({ isLoading: true });

    try {
      const dietLogsCollection = database.get<DietLog>('diet_logs');
      const records = await dietLogsCollection
        .query()
        .fetch();

      const todayLog = records.find((r) => r.date === targetDate);

      if (todayLog) {
        const mealEntriesCollection = database.get<MealEntry>('meal_entries');
        const mealRecords = await mealEntriesCollection
          .query()
          .fetch();

        const dayMeals = mealRecords
          .filter((m) => m.dietLogId === todayLog.id)
          .map((m) => ({
            id: m.id,
            serverId: m.serverId,
            client_uuid: m.clientUuid,
            diet_log_id: m.dietLogId,
            label: m.label,
            protein_g: m.proteinG,
            carbs_g: m.carbsG,
            fat_g: m.fatG,
            calories: m.calories,
            condition_tag: m.conditionTag as MealCondition,
            meal_photo_id: m.mealPhotoId,
            logged_at: m.loggedAt ? m.loggedAt.getTime() : Date.now(),
            client_timestamp: m.clientTimestamp ? m.clientTimestamp.getTime() : Date.now(),
            sync_status: SyncStatus.Pending,
          }));

        set({
          currentDietLog: {
            id: todayLog.id,
            serverId: todayLog.serverId,
            date: todayLog.date,
            body_weight: todayLog.bodyWeight,
            weight_unit: (todayLog.weightUnit as WeightUnit) ?? WeightUnit.Kg,
            sync_status: SyncStatus.Pending,
          },
          bodyWeight: todayLog.bodyWeight ?? null,
          weightUnit: (todayLog.weightUnit as WeightUnit) ?? WeightUnit.Kg,
          meals: dayMeals,
        });
      } else {
        set({
          currentDietLog: null,
          bodyWeight: null,
          meals: [],
        });
      }
    } catch (err) {
      console.error('Error loading diet day:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  saveBodyWeight: async (weight: number, unit?: WeightUnit) => {
    const { selectedDate, currentDietLog, weightUnit } = get();
    const effectiveUnit = unit ?? weightUnit;

    await database.write(async () => {
      const dietLogsCollection = database.get<DietLog>('diet_logs');

      if (currentDietLog) {
        const logRecord = await dietLogsCollection.find(currentDietLog.id);
        await logRecord.update((record) => {
          record.bodyWeight = weight;
          record.weightUnit = effectiveUnit;
        });
        set({
          bodyWeight: weight,
          weightUnit: effectiveUnit,
          currentDietLog: {
            ...currentDietLog,
            body_weight: weight,
            weight_unit: effectiveUnit,
          },
        });
      } else {
        const newRecord = await dietLogsCollection.create((record) => {
          record.date = selectedDate;
          record.bodyWeight = weight;
          record.weightUnit = effectiveUnit;
        });
        set({
          bodyWeight: weight,
          weightUnit: effectiveUnit,
          currentDietLog: {
            id: newRecord.id,
            date: selectedDate,
            body_weight: weight,
            weight_unit: effectiveUnit,
            sync_status: SyncStatus.Pending,
          },
        });
      }
    });
  },

  addMeal: async (data) => {
    const { selectedDate, currentDietLog, weightUnit } = get();
    let logId = currentDietLog?.id;

    const calcCal = data.calories !== undefined
      ? data.calories
      : calculateMealCalories(data.protein_g, data.carbs_g, data.fat_g);

    let createdMealEntity: MealEntryEntity | null = null;

    await database.write(async () => {
      const dietLogsCollection = database.get<DietLog>('diet_logs');
      const mealEntriesCollection = database.get<MealEntry>('meal_entries');

      if (!logId) {
        const newLog = await dietLogsCollection.create((record) => {
          record.date = selectedDate;
          record.weightUnit = weightUnit;
        });
        logId = newLog.id;
        set({
          currentDietLog: {
            id: newLog.id,
            date: selectedDate,
            weight_unit: weightUnit,
            sync_status: SyncStatus.Pending,
          },
        });
      }

      const clientUuid = String(uuid.v4());
      const now = new Date();

      const newMeal = await mealEntriesCollection.create((record) => {
        record.clientUuid = clientUuid;
        record.dietLogId = logId!;
        record.label = data.label;
        record.proteinG = data.protein_g;
        record.carbsG = data.carbs_g;
        record.fatG = data.fat_g;
        record.calories = calcCal;
        record.conditionTag = data.condition_tag ?? undefined;
        record.mealPhotoId = data.meal_photo_id ?? undefined;
        record.loggedAt = now;
      });

      createdMealEntity = {
        id: newMeal.id,
        client_uuid: clientUuid,
        diet_log_id: logId!,
        label: data.label,
        protein_g: data.protein_g,
        carbs_g: data.carbs_g,
        fat_g: data.fat_g,
        calories: calcCal,
        condition_tag: data.condition_tag,
        meal_photo_id: data.meal_photo_id,
        logged_at: now.getTime(),
        client_timestamp: now.getTime(),
        sync_status: SyncStatus.Pending,
      };

      set((state) => ({
        meals: [...state.meals, createdMealEntity!],
      }));
    });

    return createdMealEntity!;
  },

  updateMeal: async (mealId, data) => {
    await database.write(async () => {
      const mealRecord = await database.get<MealEntry>('meal_entries').find(mealId);
      await mealRecord.update((record) => {
        if (data.label !== undefined) record.label = data.label;
        if (data.protein_g !== undefined) record.proteinG = data.protein_g;
        if (data.carbs_g !== undefined) record.carbsG = data.carbs_g;
        if (data.fat_g !== undefined) record.fatG = data.fat_g;
        if (data.calories !== undefined) {
          record.calories = data.calories;
        } else if (data.protein_g !== undefined || data.carbs_g !== undefined || data.fat_g !== undefined) {
          record.calories = calculateMealCalories(
            data.protein_g ?? record.proteinG,
            data.carbs_g ?? record.carbsG,
            data.fat_g ?? record.fatG
          );
        }
        if (data.condition_tag !== undefined) record.conditionTag = data.condition_tag ?? undefined;
        if (data.meal_photo_id !== undefined) record.mealPhotoId = data.meal_photo_id ?? undefined;
      });

      set((state) => ({
        meals: state.meals.map((m) =>
          m.id === mealId
            ? {
                ...m,
                ...data,
                calories:
                  data.calories !== undefined
                    ? data.calories
                    : data.protein_g !== undefined || data.carbs_g !== undefined || data.fat_g !== undefined
                    ? calculateMealCalories(
                        data.protein_g ?? m.protein_g,
                        data.carbs_g ?? m.carbs_g,
                        data.fat_g ?? m.fat_g
                      )
                    : m.calories,
              }
            : m
        ),
      }));
    });
  },

  deleteMeal: async (mealId) => {
    await database.write(async () => {
      const mealRecord = await database.get<MealEntry>('meal_entries').find(mealId);
      await mealRecord.destroyPermanently();
      set((state) => ({
        meals: state.meals.filter((m) => m.id !== mealId),
      }));
    });
  },

  getDailyTotals: () => {
    const { meals } = get();
    return meals.reduce(
      (acc, meal) => ({
        protein: acc.protein + (meal.protein_g || 0),
        carbs: acc.carbs + (meal.carbs_g || 0),
        fat: acc.fat + (meal.fat_g || 0),
        calories: acc.calories + (meal.calories || 0),
      }),
      { protein: 0, carbs: 0, fat: 0, calories: 0 }
    );
  },
}));

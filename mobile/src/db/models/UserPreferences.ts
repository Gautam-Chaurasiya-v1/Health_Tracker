import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class UserPreferences extends Model {
  static table = 'user_preferences';

  // @ts-ignore
  @field('display_name') displayName: string;
  // @ts-ignore
  @field('weight_unit') weightUnit: 'kg' | 'lbs';
  // @ts-ignore
  @field('protein_goal_g') proteinGoalG: number;
  // @ts-ignore
  @field('carbs_goal_g') carbsGoalG: number;
  // @ts-ignore
  @field('fats_goal_g') fatsGoalG: number;
  // @ts-ignore
  @field('calories_goal') caloriesGoal: number;
  // @ts-ignore
  @field('onboarding_complete') onboardingComplete: boolean;
  // @ts-ignore
  @readonly @date('created_at') createdAt: Date;
  // @ts-ignore
  @date('updated_at') updatedAt: Date;
}

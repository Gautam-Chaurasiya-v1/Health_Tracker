import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class UserPreferences extends Model {
  static table = 'user_preferences';

  @field('display_name') displayName!: string;
  @field('weight_unit') weightUnit!: 'kg' | 'lbs';
  @field('protein_goal_g') proteinGoalG!: number;
  @field('carbs_goal_g') carbsGoalG!: number;
  @field('fats_goal_g') fatsGoalG!: number;
  @field('calories_goal') caloriesGoal!: number;
  @field('onboarding_complete') onboardingComplete!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}

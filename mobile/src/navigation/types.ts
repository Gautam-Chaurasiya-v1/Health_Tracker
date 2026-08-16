import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  ProgressComparison: { photoAId: string; photoBId: string };
  MealEditor: { mealId?: string; dietLogId: string };
};

export type MainTabParamList = {
  WorkoutTab: undefined;
  DietTab: undefined;
  ProgressTab: undefined;
  SettingsTab: undefined;
};

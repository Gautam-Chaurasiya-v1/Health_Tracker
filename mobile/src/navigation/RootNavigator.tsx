import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { TabNavigator } from './TabNavigator';
import { ProgressComparison } from '../screens/progress/ProgressComparison';
import { MealEditorModal } from '../screens/diet/MealEditorModal';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  initialRoute: keyof RootStackParamList;
}

export const RootNavigator: React.FC<RootNavigatorProps> = ({ initialRoute }) => {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen
        name="ProgressComparison"
        component={ProgressComparison}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MealEditor"
        component={MealEditorModal}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

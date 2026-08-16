import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { MainTabParamList } from './types';
import { colors, typography } from '../theme';

import { WorkoutLogger } from '../screens/workout/WorkoutLogger';
import { DietLog } from '../screens/diet/DietLog';
import { ProgressTimeline } from '../screens/progress/ProgressTimeline';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: typography.fontSizes.xs,
          fontWeight: typography.fontWeights.medium,
        },
      }}
    >
      <Tab.Screen
        name="WorkoutTab"
        component={WorkoutLogger}
        options={{
          tabBarLabel: 'Workout',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏋️</Text>,
        }}
      />
      <Tab.Screen
        name="DietTab"
        component={DietLog}
        options={{
          tabBarLabel: 'Diet',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🥗</Text>,
        }}
      />
      <Tab.Screen
        name="ProgressTab"
        component={ProgressTimeline}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📸</Text>,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

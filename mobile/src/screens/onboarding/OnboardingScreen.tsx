import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { Button } from '../../components/common';
import { usePreferencesStore } from '../../stores/usePreferencesStore';

import { NameStep } from './steps/NameStep';
import { UnitStep } from './steps/UnitStep';
import { GoalsStep } from './steps/GoalsStep';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentStep, setCurrentStep] = useState<number>(0);

  const calculateDefaults = usePreferencesStore((s) => s.calculateDefaults);
  const completeOnboarding = usePreferencesStore((s) => s.completeOnboarding);

  const [displayName, setDisplayName] = useState<string>('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [bodyWeight, setBodyWeight] = useState<number>(75);

  const initialDefaults = calculateDefaults(75, 'kg');
  const [proteinGoal, setProteinGoal] = useState<number>(initialDefaults.protein);
  const [carbsGoal, setCarbsGoal] = useState<number>(initialDefaults.carbs);
  const [fatsGoal, setFatsGoal] = useState<number>(initialDefaults.fat);
  const [caloriesGoal, setCaloriesGoal] = useState<number>(initialDefaults.calories);

  const handleBodyWeightChange = (newWeight: number) => {
    setBodyWeight(newWeight);
    if (newWeight > 0) {
      const defaults = calculateDefaults(newWeight, weightUnit);
      setProteinGoal(defaults.protein);
      setCarbsGoal(defaults.carbs);
      setFatsGoal(defaults.fat);
      setCaloriesGoal(defaults.calories);
    }
  };

  const handleUnitChange = (newUnit: 'kg' | 'lbs') => {
    setWeightUnit(newUnit);
    const convertedWeight = newUnit === 'lbs' ? Math.round(bodyWeight * 2.20462) : Math.round(bodyWeight / 2.20462);
    setBodyWeight(convertedWeight);
    const defaults = calculateDefaults(convertedWeight, newUnit);
    setProteinGoal(defaults.protein);
    setCarbsGoal(defaults.carbs);
    setFatsGoal(defaults.fat);
    setCaloriesGoal(defaults.calories);
  };

  const handleResetDefaults = () => {
    const defaults = calculateDefaults(bodyWeight, weightUnit);
    setProteinGoal(defaults.protein);
    setCarbsGoal(defaults.carbs);
    setFatsGoal(defaults.fat);
    setCaloriesGoal(defaults.calories);
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      if (!displayName.trim()) {
        Alert.alert('Name Required', 'Please enter your name to continue.');
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (proteinGoal <= 0 || caloriesGoal <= 0) {
        Alert.alert('Invalid Goals', 'Please ensure your macro and calorie goals are greater than zero.');
        return;
      }

      await completeOnboarding({
        displayName: displayName.trim(),
        weightUnit,
        bodyWeight,
        proteinGoalG: proteinGoal,
        carbsGoalG: carbsGoal,
        fatsGoalG: fatsGoal,
        caloriesGoal,
      });

      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressBar}>
        <View
          testID="step-indicator"
          style={[
            styles.progressFill,
            { width: `${((currentStep + 1) / 3) * 100}%` },
          ]}
        />
      </View>

      <View style={styles.content}>
        {currentStep === 0 && (
          <NameStep name={displayName} onChangeName={setDisplayName} />
        )}
        {currentStep === 1 && (
          <UnitStep unit={weightUnit} onChangeUnit={handleUnitChange} />
        )}
        {currentStep === 2 && (
          <GoalsStep
            weightUnit={weightUnit}
            bodyWeight={bodyWeight}
            proteinGoal={proteinGoal}
            carbsGoal={carbsGoal}
            fatsGoal={fatsGoal}
            caloriesGoal={caloriesGoal}
            onChangeBodyWeight={handleBodyWeightChange}
            onChangeProtein={setProteinGoal}
            onChangeCarbs={setCarbsGoal}
            onChangeFats={setFatsGoal}
            onChangeCalories={setCaloriesGoal}
            onResetDefaults={handleResetDefaults}
          />
        )}
      </View>

      <View style={styles.footer}>
        {currentStep > 0 ? (
          <Button
            testID="back-btn"
            title="Back"
            variant="ghost"
            style={styles.navButton}
            onPress={handleBack}
          />
        ) : (
          <View style={styles.navButton} />
        )}

        <Button
          testID="next-btn"
          title={currentStep === 2 ? 'Get Started' : 'Next'}
          variant="primary"
          style={styles.navButton}
          onPress={handleNext}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surfaceHighlight,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});

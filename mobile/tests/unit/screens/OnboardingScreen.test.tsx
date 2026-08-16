import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingScreen } from '../../../src/screens/onboarding/OnboardingScreen';
import { usePreferencesStore } from '../../../src/stores/usePreferencesStore';
import { database } from '../../../src/db';
import { Alert } from 'react-native';

const mockReset = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    reset: mockReset,
  }),
}));

describe('OnboardingScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
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
    });
  });

  it('renders Step 1 (Name) on initial launch', () => {
    const { getByText, getByTestId } = render(<OnboardingScreen />);
    expect(getByText("What's your name?")).toBeTruthy();
    expect(getByTestId('name-input')).toBeTruthy();
  });

  it('shows alert and blocks navigation if name is empty', () => {
    const { getByTestId } = render(<OnboardingScreen />);
    fireEvent.press(getByTestId('next-btn'));
    expect(Alert.alert).toHaveBeenCalledWith('Name Required', expect.any(String));
  });

  it('advances through Step 1 -> Step 2 -> Step 3 and completes onboarding', async () => {
    const { getByTestId, getByText } = render(<OnboardingScreen />);

    // Step 0: Name
    fireEvent.changeText(getByTestId('name-input'), 'Jordan');
    fireEvent.press(getByTestId('next-btn'));

    // Step 1: Unit
    expect(getByText('Choose Your Unit')).toBeTruthy();
    fireEvent.press(getByTestId('unit-option-lbs'));
    fireEvent.press(getByTestId('next-btn'));

    // Step 2: Goals
    expect(getByText('Set Your Targets')).toBeTruthy();
    expect(getByTestId('calories-goal-input')).toBeTruthy();

    fireEvent.press(getByTestId('next-btn'));

    await waitFor(() => {
      expect(usePreferencesStore.getState().displayName).toBe('Jordan');
      expect(usePreferencesStore.getState().onboardingComplete).toBe(true);
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    });
  });
});

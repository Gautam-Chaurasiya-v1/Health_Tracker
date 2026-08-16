import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { DietLog } from '../../../src/screens/diet/DietLog';
import { useDietStore } from '../../../src/stores/useDietStore';
import { usePreferencesStore } from '../../../src/stores/usePreferencesStore';
import { database } from '../../../src/db';
import { Alert } from 'react-native';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('DietLog Screen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    usePreferencesStore.setState({
      displayName: 'Alex',
      weightUnit: 'kg',
      proteinGoalG: 160,
      carbsGoalG: 200,
      fatsGoalG: 60,
      caloriesGoal: 2000,
      onboardingComplete: true,
    });
    useDietStore.setState({
      selectedDate: '2026-08-16',
      currentDietLog: null,
      meals: [],
      bodyWeight: null,
      weightUnit: 'kg' as any,
      isLoading: false,
    });
  });

  it('renders date navigation and empty state when no meals exist', () => {
    const { getByTestId, getByText } = render(<DietLog />);
    expect(getByTestId('date-display')).toBeTruthy();
    expect(getByTestId('empty-meals-state')).toBeTruthy();
    expect(getByText('No meals logged yet')).toBeTruthy();
  });

  it('allows logging body weight', async () => {
    const { getByTestId } = render(<DietLog />);
    const weightInput = getByTestId('weight-input');
    fireEvent.changeText(weightInput, '77.5');
    fireEvent.press(getByTestId('save-weight-btn'));

    await waitFor(() => {
      expect(useDietStore.getState().bodyWeight).toBe(77.5);
    });
  });

  it('navigates to next and previous dates', async () => {
    const { getByTestId } = render(<DietLog />);
    fireEvent.press(getByTestId('next-date-btn'));
    expect(useDietStore.getState().selectedDate).toBe('2026-08-17');

    fireEvent.press(getByTestId('prev-date-btn'));
    expect(useDietStore.getState().selectedDate).toBe('2026-08-16');
  });

  it('navigates to MealEditor on + Add Meal press', () => {
    const { getByTestId } = render(<DietLog />);
    fireEvent.press(getByTestId('add-meal-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('MealEditor', {
      dietLogId: '2026-08-16',
    });
  });
});

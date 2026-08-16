import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MealEntryCard } from '../../../src/components/diet/MealEntryCard';
import { MealCondition, SyncStatus } from '../../../../shared/types/enums';
import { MealEntryEntity } from '../../../../shared/types/entities';

const mockMeal: MealEntryEntity = {
  id: 'meal-1',
  client_uuid: 'uuid-1',
  diet_log_id: 'log-1',
  label: 'Chicken & Sweet Potato',
  protein_g: 45,
  carbs_g: 50,
  fat_g: 10,
  calories: 470,
  condition_tag: MealCondition.HighEnergy,
  logged_at: Date.now(),
  client_timestamp: Date.now(),
  sync_status: SyncStatus.Pending,
};

describe('MealEntryCard Component', () => {
  it('renders meal label, macros, and condition tag', () => {
    const { getByText } = render(<MealEntryCard meal={mockMeal} />);
    expect(getByText('Chicken & Sweet Potato')).toBeTruthy();
    expect(getByText('P: 45g')).toBeTruthy();
    expect(getByText('C: 50g')).toBeTruthy();
    expect(getByText('F: 10g')).toBeTruthy();
    expect(getByText('470 kcal')).toBeTruthy();
    expect(getByText('high energy')).toBeTruthy();
  });

  it('triggers onDelete when delete button is pressed', () => {
    const handleDelete = jest.fn();
    const { getByTestId } = render(
      <MealEntryCard testID="test-meal" meal={mockMeal} onDelete={handleDelete} />
    );
    fireEvent.press(getByTestId('test-meal-delete'));
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });
});

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ExerciseLibrary } from '../../../src/screens/workout/ExerciseLibrary';
import { database } from '../../../src/db';
import { seedExercisesIfEmpty } from '../../../src/db/seedService';
import { useWorkoutStore } from '../../../src/stores/useWorkoutStore';
import Exercise from '../../../src/db/models/Exercise';

describe('ExerciseLibrary Screen', () => {
  beforeEach(async () => {
    useWorkoutStore.getState().reset();
    await seedExercisesIfEmpty(database);
  });

  it('Renders all 20 seeded exercises on load with no filter', async () => {
    const { getByText, getAllByTestId } = render(<ExerciseLibrary />);

    await waitFor(() => {
      expect(getByText('Barbell Back Squat')).toBeTruthy();
      expect(getByText('Romanian Deadlift')).toBeTruthy();
    });
  });

  it('Search "squat" shows only exercises with "squat" in name', async () => {
    const { getByTestId, getByText, queryByText } = render(<ExerciseLibrary />);

    await waitFor(() => {
      expect(getByText('Barbell Back Squat')).toBeTruthy();
    });

    const searchInput = getByTestId('exercise-search-input');
    fireEvent.changeText(searchInput, 'squat');

    await waitFor(() => {
      expect(getByText('Barbell Back Squat')).toBeTruthy();
      expect(getByText('Hack Squat')).toBeTruthy();
      expect(queryByText('Barbell Bench Press')).toBeNull();
    });
  });

  it('Search is case-insensitive ("SQUAT" matches "Barbell Back Squat")', async () => {
    const { getByTestId, getByText } = render(<ExerciseLibrary />);

    await waitFor(() => {
      expect(getByText('Barbell Back Squat')).toBeTruthy();
    });

    const searchInput = getByTestId('exercise-search-input');
    fireEvent.changeText(searchInput, 'SQUAT');

    await waitFor(() => {
      expect(getByText('Barbell Back Squat')).toBeTruthy();
    });
  });

  it('Muscle group chip "chest" shows only chest exercises', async () => {
    const { getByTestId, getByText, queryByText } = render(<ExerciseLibrary />);

    await waitFor(() => {
      expect(getByText('Barbell Bench Press')).toBeTruthy();
    });

    const chestChip = getByTestId('muscle-group-chip-chest');
    fireEvent.press(chestChip);

    await waitFor(() => {
      expect(getByText('Barbell Bench Press')).toBeTruthy();
      expect(getByText('Incline Dumbbell Press')).toBeTruthy();
      expect(queryByText('Barbell Back Squat')).toBeNull();
    });
  });

  it('Muscle group chip "all" resets filter', async () => {
    const { getByTestId, getByText } = render(<ExerciseLibrary />);

    const chestChip = getByTestId('muscle-group-chip-chest');
    fireEvent.press(chestChip);

    const allChip = getByTestId('muscle-group-chip-all');
    fireEvent.press(allChip);

    await waitFor(() => {
      expect(getByText('Barbell Back Squat')).toBeTruthy();
      expect(getByText('Barbell Bench Press')).toBeTruthy();
    });
  });

  it('Custom exercise modal has name, muscle_group, equipment fields and creates DB record', async () => {
    const { getByTestId, getByText } = render(<ExerciseLibrary />);

    const fab = getByTestId('add-custom-exercise-fab');
    fireEvent.press(fab);

    expect(getByTestId('custom-exercise-modal')).toBeTruthy();
    expect(getByTestId('custom-exercise-name-input')).toBeTruthy();
    expect(getByTestId('custom-exercise-equipment-input')).toBeTruthy();

    fireEvent.changeText(getByTestId('custom-exercise-name-input'), 'Custom Cable Lateral');
    fireEvent.changeText(getByTestId('custom-exercise-equipment-input'), 'Cable');
    fireEvent.press(getByTestId('modal-muscle-chip-shoulders'));

    fireEvent.press(getByTestId('save-custom-exercise-btn'));

    await waitFor(async () => {
      const records = await database.collections.get<Exercise>('exercises').query().fetch();
      const custom = records.find((r) => r.name === 'Custom Cable Lateral');
      expect(custom).toBeDefined();
      expect(custom?.isCustom).toBe(true);
      expect(custom?.muscleGroup).toBe('shoulders');
    });
  });

  it('Selecting an exercise calls addExerciseEntry and navigates back', async () => {
    const navigation = { goBack: jest.fn() };
    const { getByText } = render(<ExerciseLibrary navigation={navigation} />);

    await waitFor(() => {
      expect(getByText('Barbell Bench Press')).toBeTruthy();
    });

    fireEvent.press(getByText('Barbell Bench Press'));

    await waitFor(() => {
      expect(useWorkoutStore.getState().activeExerciseEntryId).toBeTruthy();
      expect(navigation.goBack).toHaveBeenCalledTimes(1);
    });
  });
});

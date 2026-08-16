import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WorkoutLogger } from '../../../src/screens/workout/WorkoutLogger';
import { useWorkoutStore } from '../../../src/stores/useWorkoutStore';
import { database } from '../../../src/db';
import Exercise from '../../../src/db/models/Exercise';
import { WorkoutCondition } from '../../../../shared/types/enums';

describe('WorkoutLogger Screen', () => {
  beforeEach(async () => {
    useWorkoutStore.getState().reset();
  });

  it('Renders current exercise title and select button', async () => {
    const { getByTestId, getByText } = render(<WorkoutLogger />);

    expect(getByTestId('workout-logger-screen')).toBeTruthy();
    expect(getByTestId('current-exercise-title')).toBeTruthy();
    expect(getByText('+ Select')).toBeTruthy();
  });

  it('Select button calls navigation to ExerciseLibrary', () => {
    const navigation = { navigate: jest.fn() };
    const { getByTestId } = render(<WorkoutLogger navigation={navigation} />);

    const selectBtn = getByTestId('select-exercise-btn');
    fireEvent.press(selectBtn);
    expect(navigation.navigate).toHaveBeenCalledWith('ExerciseLibrary');
  });

  it('Renders condition tags and allows selecting chips', async () => {
    const { getByTestId } = render(<WorkoutLogger />);

    const highEnergyChip = getByTestId(`condition-chip-${WorkoutCondition.HIGH_ENERGY}`);
    expect(highEnergyChip).toBeTruthy();

    fireEvent.press(highEnergyChip);
  });

  it('Loads and displays active exercise name when selected', async () => {
    let exerciseId = '';
    await database.write(async () => {
      const ex = await database.collections.get<Exercise>('exercises').create((r) => {
        r.name = 'Incline Dumbbell Press';
        r.muscleGroup = 'chest';
        r.isCustom = false;
      });
      exerciseId = ex.id;
    });

    const sessionId = await useWorkoutStore.getState().startSession('2026-08-17');
    await useWorkoutStore.getState().addExerciseEntry(sessionId, exerciseId);

    const { getByTestId, getByText } = render(<WorkoutLogger />);

    await waitFor(() => {
      expect(getByText('Incline Dumbbell Press')).toBeTruthy();
    });
  });

  it('Finish button finishes the active session', async () => {
    const sessionId = await useWorkoutStore.getState().startSession('2026-08-17');
    const { getByTestId } = render(<WorkoutLogger />);

    const finishBtn = getByTestId('finish-workout-btn');
    fireEvent.press(finishBtn);

    await waitFor(() => {
      expect(useWorkoutStore.getState().activeSessionId).toBeNull();
    });
  });
});

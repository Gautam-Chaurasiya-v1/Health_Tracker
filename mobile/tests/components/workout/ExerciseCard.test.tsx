import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ExerciseCard } from '../../../src/components/workout/ExerciseCard';

describe('ExerciseCard Component', () => {
  it('Renders exercise name', () => {
    const exercise = {
      id: 'ex-1',
      name: 'Barbell Back Squat',
      muscleGroup: 'quads',
      equipment: 'barbell',
      isCustom: false,
    };

    const { getByText } = render(<ExerciseCard exercise={exercise} onPress={jest.fn()} />);
    expect(getByText('Barbell Back Squat')).toBeTruthy();
  });

  it('Renders muscle_group and equipment subtitle', () => {
    const exercise = {
      id: 'ex-2',
      name: 'Lat Pulldown',
      muscleGroup: 'back',
      equipment: 'cable',
      isCustom: false,
    };

    const { getByText } = render(<ExerciseCard exercise={exercise} onPress={jest.fn()} />);
    expect(getByText('back · cable')).toBeTruthy();
  });

  it('Shows [Custom] badge when is_custom is true', () => {
    const exercise = {
      id: 'ex-custom',
      name: 'Custom Pushup',
      muscleGroup: 'chest',
      isCustom: true,
    };

    const { getByTestId, getByText } = render(
      <ExerciseCard exercise={exercise} onPress={jest.fn()} />
    );
    expect(getByTestId('custom-badge')).toBeTruthy();
    expect(getByText('Custom')).toBeTruthy();
  });

  it('Does NOT show [Custom] badge when is_custom is false', () => {
    const exercise = {
      id: 'ex-standard',
      name: 'Bench Press',
      muscleGroup: 'chest',
      isCustom: false,
    };

    const { queryByTestId } = render(<ExerciseCard exercise={exercise} onPress={jest.fn()} />);
    expect(queryByTestId('custom-badge')).toBeNull();
  });

  it('onPress fires when card tapped', () => {
    const onPress = jest.fn();
    const exercise = {
      id: 'ex-tap',
      name: 'Overhead Press',
      muscleGroup: 'shoulders',
      isCustom: false,
    };

    const { getByTestId } = render(<ExerciseCard exercise={exercise} onPress={onPress} />);
    fireEvent.press(getByTestId('exercise-card-ex-tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

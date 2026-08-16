import React from 'react';
import { render } from '@testing-library/react-native';
import { SetRow } from '../../../src/components/workout/SetRow';

describe('SetRow Component', () => {
  it('renders set info correctly with kg unit', () => {
    const set = {
      setNumber: 1,
      weight: 100,
      reps: 8,
      rir: 2,
    };

    const { getByText } = render(<SetRow set={set} weightUnit="kg" />);
    expect(getByText('#1')).toBeTruthy();
    expect(getByText('Set 1 — 100 kg × 8 reps @ 2 RIR')).toBeTruthy();
  });

  it('renders set info correctly with lbs unit', () => {
    const set = {
      setNumber: 3,
      weight: 225,
      reps: 5,
      rir: 1,
    };

    const { getByText } = render(<SetRow set={set} weightUnit="lbs" />);
    expect(getByText('#3')).toBeTruthy();
    expect(getByText('Set 3 — 225 lbs × 5 reps @ 1 RIR')).toBeTruthy();
  });

  it('renders notes when provided', () => {
    const set = {
      setNumber: 2,
      weight: 100,
      reps: 8,
      rir: 2,
      notes: 'Felt light, push next week',
    };

    const { getByText } = render(<SetRow set={set} weightUnit="kg" />);
    expect(getByText('Felt light, push next week')).toBeTruthy();
  });
});

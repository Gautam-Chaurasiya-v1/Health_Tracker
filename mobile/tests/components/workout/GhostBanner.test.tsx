import React from 'react';
import { render } from '@testing-library/react-native';
import { GhostBanner, formatSessionDate } from '../../../src/components/workout/GhostBanner';
import { useGhostStore } from '../../../src/stores/useGhostStore';

describe('GhostBanner Component', () => {
  beforeEach(() => {
    useGhostStore.getState().clearCache();
  });

  it('Renders empty state text when snapshot is null', () => {
    const { getByTestId, getByText } = render(<GhostBanner exerciseId="empty-ex" />);
    expect(getByTestId('ghost-banner-empty')).toBeTruthy();
    expect(
      getByText('No previous data — first time logging this exercise')
    ).toBeTruthy();
  });

  it('Does NOT render any loading/spinner element', () => {
    const { queryByTestId } = render(<GhostBanner exerciseId="no-spinner-test" />);
    expect(queryByTestId('loading-spinner')).toBeNull();
    expect(queryByTestId('activity-indicator')).toBeNull();
  });

  it('Renders correct text for all sets of a snapshot', () => {
    const snapshot = {
      sessionDate: '2026-08-10',
      sets: [
        { setNumber: 1, weight: 100, reps: 8, rir: 2 },
        { setNumber: 2, weight: 100, reps: 8, rir: 1 },
        { setNumber: 3, weight: 100, reps: 6, rir: 0 },
      ],
      totalVolume: 2200,
    };
    useGhostStore.getState().updateCache('multi-set-ex', snapshot);

    const { getByTestId, getByText } = render(
      <GhostBanner exerciseId="multi-set-ex" weightUnit="kg" />
    );

    expect(getByTestId('ghost-banner')).toBeTruthy();
    expect(getByText('Set 1: 100kg × 8 @ 2 RIR')).toBeTruthy();
    expect(getByText('Set 2: 100kg × 8 @ 1 RIR')).toBeTruthy();
    expect(getByText('Set 3: 100kg × 6 @ 0 RIR')).toBeTruthy();
    expect(getByText('Total Volume: 2200 kg')).toBeTruthy();
  });

  it('Shows "Last Week" for a session 7 days ago', () => {
    const baseDate = new Date('2026-08-17');
    const result = formatSessionDate('2026-08-10', baseDate);
    expect(result).toBe('Last Week');
  });

  it('Shows "2 Weeks Ago" for a session 14 days ago', () => {
    const baseDate = new Date('2026-08-17');
    const result = formatSessionDate('2026-08-03', baseDate);
    expect(result).toBe('2 Weeks Ago');
  });

  it('Shows "MMM d" format for a session > 30 days ago', () => {
    const baseDate = new Date('2026-08-17');
    const result = formatSessionDate('2026-06-15', baseDate);
    expect(result).toBe('Jun 15');
  });
});

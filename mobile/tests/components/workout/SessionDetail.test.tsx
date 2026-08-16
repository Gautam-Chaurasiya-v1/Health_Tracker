import React from 'react';
import { render } from '@testing-library/react-native';
import { SessionDetail, SessionDetailData } from '../../../src/screens/workout/SessionDetail';

describe('SessionDetail Screen', () => {
  const mockDetail: SessionDetailData = {
    id: 'session-detail-1',
    date: '2026-08-16',
    startedAt: 1723800000000,
    finishedAt: 1723804500000, // 75m = 1h 15m
    notes: 'Great pump today, progressive overload achieved on squat',
    conditionTags: ['high_energy'],
    grandTotalVolume: 5400,
    entries: [
      {
        entryId: 'entry-1',
        exerciseName: 'Barbell Back Squat',
        muscleGroup: 'quads',
        exerciseVolume: 3000,
        sets: [
          { setNumber: 1, weight: 100, reps: 10, rir: 2 },
          { setNumber: 2, weight: 100, reps: 10, rir: 2 },
          { setNumber: 3, weight: 100, reps: 10, rir: 1 },
        ],
      },
      {
        entryId: 'entry-2',
        exerciseName: 'Barbell Bench Press',
        muscleGroup: 'chest',
        exerciseVolume: 2400,
        sets: [
          { setNumber: 1, weight: 80, reps: 10, rir: 2 },
          { setNumber: 2, weight: 80, reps: 10, rir: 2 },
          { setNumber: 3, weight: 80, reps: 10, rir: 1 },
        ],
      },
    ],
  };

  it('Renders exercise name and volume for each exercise entry', () => {
    const { getByText, getAllByTestId } = render(
      <SessionDetail sessionOverride={mockDetail} />
    );

    expect(getByText('Barbell Back Squat')).toBeTruthy();
    expect(getByText('Barbell Bench Press')).toBeTruthy();
    expect(getByText('Volume: 3000 kg')).toBeTruthy();
    expect(getByText('Volume: 2400 kg')).toBeTruthy();
  });

  it('Renders all sets in correct format', () => {
    const { getAllByText } = render(
      <SessionDetail sessionOverride={mockDetail} />
    );

    expect(getAllByText('Set 1:  100kg × 10  @  2 RIR').length).toBeGreaterThan(0);
    expect(getAllByText('Set 1:  80kg × 10  @  2 RIR').length).toBeGreaterThan(0);
  });

  it('Shows session notes when present', () => {
    const { getByTestId, getByText } = render(
      <SessionDetail sessionOverride={mockDetail} />
    );

    expect(getByTestId('session-notes-section')).toBeTruthy();
    expect(
      getByText('Great pump today, progressive overload achieved on squat')
    ).toBeTruthy();
  });

  it('Does not show notes section when notes is null/empty', () => {
    const detailWithoutNotes: SessionDetailData = {
      ...mockDetail,
      notes: undefined,
    };

    const { queryByTestId } = render(
      <SessionDetail sessionOverride={detailWithoutNotes} />
    );

    expect(queryByTestId('session-notes-section')).toBeNull();
  });

  it('Renders grand total volume and duration', () => {
    const { getByText } = render(
      <SessionDetail sessionOverride={mockDetail} />
    );

    expect(getByText('Total Volume: 5400 kg')).toBeTruthy();
    expect(getByText('⏱  Duration: 1h 15m')).toBeTruthy();
  });

  it('Renders condition tags', () => {
    const { getByText } = render(
      <SessionDetail sessionOverride={mockDetail} />
    );

    expect(getByText('high energy')).toBeTruthy();
  });
});

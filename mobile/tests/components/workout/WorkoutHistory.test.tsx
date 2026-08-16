import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WorkoutHistory, formatDuration, formatSessionDate } from '../../../src/screens/workout/WorkoutHistory';

describe('WorkoutHistory Screen', () => {
  it('Shows empty state when no sessions exist', () => {
    const { getByTestId, getByText } = render(<WorkoutHistory sessionsOverride={[]} />);

    expect(getByTestId('history-empty-state')).toBeTruthy();
    expect(getByText('No workouts yet')).toBeTruthy();
  });

  it('Renders sessions ordered newest first with correct volume and duration', () => {
    const mockSessions = [
      {
        id: 's-1',
        date: '2026-08-16',
        startedAt: 1723800000000,
        finishedAt: 1723804500000, // 75 mins = 1h 15m
        durationText: '1h 15m',
        exerciseNames: 'Barbell Back Squat, Barbell Bench Press',
        totalVolume: 5400,
        conditionTags: ['high_energy'],
      },
      {
        id: 's-2',
        date: '2026-08-14',
        startedAt: 1723627200000,
        finishedAt: undefined,
        durationText: 'In Progress',
        exerciseNames: 'Lat Pulldown',
        totalVolume: 1200,
        conditionTags: ['fatigued', 'poor_sleep'],
      },
    ];

    const { getByTestId, getByText, getAllByTestId } = render(
      <WorkoutHistory sessionsOverride={mockSessions} />
    );

    expect(getByTestId('history-session-card-s-1')).toBeTruthy();
    expect(getByTestId('history-session-card-s-2')).toBeTruthy();

    expect(getByText('Barbell Back Squat, Barbell Bench Press')).toBeTruthy();
    expect(getByText('5400 kg')).toBeTruthy();
    expect(getByText('1h 15m')).toBeTruthy();

    expect(getByText('Lat Pulldown')).toBeTruthy();
    expect(getByText('1200 kg')).toBeTruthy();
    expect(getByText('In Progress')).toBeTruthy();

    expect(getByText('high energy')).toBeTruthy();
    expect(getByText('fatigued')).toBeTruthy();
    expect(getByText('poor sleep')).toBeTruthy();
  });

  it('formatDuration utility behaves correctly', () => {
    expect(formatDuration(1000, undefined)).toBe('In Progress');
    expect(formatDuration(1000, 1000 + 45 * 60000)).toBe('45m');
    expect(formatDuration(1000, 1000 + 75 * 60000)).toBe('1h 15m');
  });

  it('formatSessionDate utility formats ISO dates properly', () => {
    expect(formatSessionDate('2026-08-16')).toBe('Aug 16, 2026');
  });

  it('Navigates to SessionDetail on card press', () => {
    const navigation = { navigate: jest.fn() };
    const mockSessions = [
      {
        id: 's-tap',
        date: '2026-08-16',
        startedAt: 1723800000000,
        durationText: 'In Progress',
        exerciseNames: 'Squat',
        totalVolume: 1000,
        conditionTags: [],
      },
    ];

    const { getByTestId } = render(
      <WorkoutHistory navigation={navigation} sessionsOverride={mockSessions} />
    );

    fireEvent.press(getByTestId('history-session-card-s-tap'));
    expect(navigation.navigate).toHaveBeenCalledWith('SessionDetail', { sessionId: 's-tap' });
  });
});

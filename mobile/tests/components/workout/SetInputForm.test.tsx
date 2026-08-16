import React from 'react';
import { render, fireEvent, within } from '@testing-library/react-native';
import { SetInputForm } from '../../../src/components/workout/SetInputForm';

describe('SetInputForm Component', () => {
  it('Renders with previousSet values pre-filled', () => {
    const prev = { weight: 80, reps: 10, rir: 3 };
    const { getByTestId } = render(
      <SetInputForm previousSet={prev} weightUnit="kg" onConfirm={jest.fn()} />
    );

    const input = getByTestId('weight-input');
    expect(input.props.value).toBe('80');

    const repsStepper = getByTestId('reps-stepper');
    expect(within(repsStepper).getByText('10')).toBeTruthy();

    const rirStepper = getByTestId('rir-stepper');
    expect(within(rirStepper).getByText('3')).toBeTruthy();
  });

  it('Renders defaults (weight=0, reps=5, rir=2) when previousSet is null', () => {
    const { getByTestId } = render(
      <SetInputForm previousSet={null} weightUnit="kg" onConfirm={jest.fn()} />
    );

    const input = getByTestId('weight-input');
    expect(input.props.value).toBe('');

    const repsStepper = getByTestId('reps-stepper');
    expect(within(repsStepper).getByText('5')).toBeTruthy();

    const rirStepper = getByTestId('rir-stepper');
    expect(within(rirStepper).getByText('2')).toBeTruthy();
  });

  it('RIR stepper cannot go below 0', () => {
    const { getByTestId } = render(
      <SetInputForm previousSet={{ weight: 50, reps: 8, rir: 0 }} onConfirm={jest.fn()} />
    );

    const decBtn = getByTestId('rir-stepper-dec');
    fireEvent.press(decBtn);

    const rirStepper = getByTestId('rir-stepper');
    expect(within(rirStepper).getByText('0')).toBeTruthy();
  });

  it('RIR stepper cannot go above 5', () => {
    const { getByTestId } = render(
      <SetInputForm previousSet={{ weight: 50, reps: 8, rir: 5 }} onConfirm={jest.fn()} />
    );

    const incBtn = getByTestId('rir-stepper-inc');
    fireEvent.press(incBtn);

    const rirStepper = getByTestId('rir-stepper');
    expect(within(rirStepper).getByText('5')).toBeTruthy();
  });

  it('Reps stepper cannot go below 1', () => {
    const { getByTestId } = render(
      <SetInputForm previousSet={{ weight: 50, reps: 1, rir: 2 }} onConfirm={jest.fn()} />
    );

    const decBtn = getByTestId('reps-stepper-dec');
    fireEvent.press(decBtn);

    const repsStepper = getByTestId('reps-stepper');
    expect(within(repsStepper).getByText('1')).toBeTruthy();
  });

  it('Reps stepper cannot go above 100', () => {
    const { getByTestId } = render(
      <SetInputForm previousSet={{ weight: 50, reps: 100, rir: 2 }} onConfirm={jest.fn()} />
    );

    const incBtn = getByTestId('reps-stepper-inc');
    fireEvent.press(incBtn);

    const repsStepper = getByTestId('reps-stepper');
    expect(within(repsStepper).getByText('100')).toBeTruthy();
  });

  it('Confirm button disabled when weight = 0', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <SetInputForm previousSet={null} onConfirm={onConfirm} />
    );

    const btn = getByTestId('confirm-set-btn');
    expect(btn.props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(btn);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Confirm button enabled when weight > 0', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <SetInputForm previousSet={{ weight: 60, reps: 5, rir: 2 }} onConfirm={onConfirm} />
    );

    const btn = getByTestId('confirm-set-btn');
    expect(btn.props.accessibilityState?.disabled).toBe(false);
  });

  it('onConfirm called with correct { weight, reps, rir }', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <SetInputForm previousSet={{ weight: 100, reps: 8, rir: 2 }} onConfirm={onConfirm} />
    );

    const btn = getByTestId('confirm-set-btn');
    fireEvent.press(btn);
    expect(onConfirm).toHaveBeenCalledWith({
      weight: 100,
      reps: 8,
      rir: 2,
    });
  });

  it('Second confirm tap within 300ms does NOT fire onConfirm again', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <SetInputForm previousSet={{ weight: 100, reps: 8, rir: 2 }} onConfirm={onConfirm} />
    );

    const btn = getByTestId('confirm-set-btn');
    fireEvent.press(btn);
    fireEvent.press(btn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

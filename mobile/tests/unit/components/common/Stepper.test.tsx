import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Stepper } from '../../../../src/components/common/Stepper';

describe('Stepper Component', () => {
  it('renders value and label correctly', () => {
    const { getByText } = render(
      <Stepper value={5} min={0} max={10} onChange={() => {}} label="Test Label" unit="kg" />
    );
    expect(getByText('Test Label')).toBeTruthy();
    expect(getByText('5 kg')).toBeTruthy();
  });

  it('increments value on plus press when below max', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <Stepper testID="stepper" value={5} min={0} max={10} onChange={handleChange} />
    );
    fireEvent.press(getByTestId('stepper-inc'));
    expect(handleChange).toHaveBeenCalledWith(6);
  });

  it('decrements value on minus press when above min', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <Stepper testID="stepper" value={5} min={0} max={10} onChange={handleChange} />
    );
    fireEvent.press(getByTestId('stepper-dec'));
    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it('does not decrement below min', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <Stepper testID="stepper" value={0} min={0} max={10} onChange={handleChange} />
    );
    fireEvent.press(getByTestId('stepper-dec'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('does not increment above max', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <Stepper testID="stepper" value={10} min={0} max={10} onChange={handleChange} />
    );
    fireEvent.press(getByTestId('stepper-inc'));
    expect(handleChange).not.toHaveBeenCalled();
  });
});

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../../../src/components/common/Button';

describe('Button Component', () => {
  it('renders title correctly', () => {
    const { getByText } = render(<Button title="Save Changes" onPress={() => {}} />);
    expect(getByText('Save Changes')).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const handlePress = jest.fn();
    const { getByTestId } = render(
      <Button testID="test-btn" title="Click Me" onPress={handlePress} />
    );
    fireEvent.press(getByTestId('test-btn'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', () => {
    const handlePress = jest.fn();
    const { getByTestId } = render(
      <Button testID="test-btn" title="Disabled" onPress={handlePress} disabled />
    );
    fireEvent.press(getByTestId('test-btn'));
    expect(handlePress).not.toHaveBeenCalled();
  });
});

import React from 'react';
import { render } from '@testing-library/react-native';
import { MacroProgressBar } from '../../../src/components/diet/MacroProgressBar';
import { colors } from '../../../src/theme';

describe('MacroProgressBar Component', () => {
  it('shows 0% bar when no intake logged', () => {
    const { getByTestId, getByText } = render(
      <MacroProgressBar testID="protein-bar" label="Protein" current={0} goal={180} unit="g" />
    );
    expect(getByText('0 / 180 g')).toBeTruthy();
    const fill = getByTestId('protein-bar-fill');
    expect(fill.props.style).toContainEqual({ width: '0%', backgroundColor: colors.primary });
  });

  it('shows 80% fill with success color when 144g logged vs 180g goal', () => {
    const { getByTestId, getByText } = render(
      <MacroProgressBar testID="protein-bar" label="Protein" current={144} goal={180} unit="g" />
    );
    expect(getByText('144 / 180 g')).toBeTruthy();
    const fill = getByTestId('protein-bar-fill');
    expect(fill.props.style).toContainEqual({ width: '80%', backgroundColor: colors.success });
  });

  it('shows warning color when > 100% of goal', () => {
    const { getByTestId, getByText } = render(
      <MacroProgressBar testID="cal-bar" label="Calories" current={2200} goal={2000} unit="kcal" />
    );
    expect(getByText('2200 / 2000 kcal')).toBeTruthy();
    const fill = getByTestId('cal-bar-fill');
    expect(fill.props.style).toContainEqual({ width: '100%', backgroundColor: colors.warning });
  });
});

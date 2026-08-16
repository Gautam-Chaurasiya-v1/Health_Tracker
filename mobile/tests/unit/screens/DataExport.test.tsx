import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { DataExport } from '../../../src/screens/settings/DataExport';
import * as exportService from '../../../src/utils/exportService';
import { database } from '../../../src/db';
import { Alert } from 'react-native';

jest.mock('../../../src/utils/exportService', () => ({
  estimateBackupSize: jest.fn().mockResolvedValue('1.2 MB'),
  exportFullBackupJSON: jest.fn().mockResolvedValue({ filePath: '/mock/backup.json' }),
  exportWorkoutCSV: jest.fn().mockResolvedValue({ filePath: '/mock/workouts.csv' }),
}));

describe('DataExport Screen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  });

  it('renders backup size and action buttons', async () => {
    const { getByTestId, getByText } = render(<DataExport />);
    expect(getByTestId('export-json-btn')).toBeTruthy();
    expect(getByTestId('export-csv-btn')).toBeTruthy();
    expect(getByTestId('import-json-btn')).toBeTruthy();

    await waitFor(() => {
      expect(getByText('1.2 MB')).toBeTruthy();
    });
  });

  it('triggers JSON and CSV export actions on button press', async () => {
    const { getByTestId } = render(<DataExport />);

    fireEvent.press(getByTestId('export-json-btn'));
    await waitFor(() => {
      expect(exportService.exportFullBackupJSON).toHaveBeenCalled();
    });

    fireEvent.press(getByTestId('export-csv-btn'));
    await waitFor(() => {
      expect(exportService.exportWorkoutCSV).toHaveBeenCalled();
    });
  });
});

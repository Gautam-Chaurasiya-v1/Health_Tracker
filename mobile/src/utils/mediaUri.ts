import RNFS from 'react-native-fs';

export const getFullMediaUri = (localUri?: string | null): string | null => {
  if (!localUri) return null;
  if (localUri.startsWith('http') || localUri.startsWith('file://') || localUri.startsWith('data:')) {
    return localUri;
  }
  return `file://${RNFS.DocumentDirectoryPath}/${localUri}`;
};

import RNFS from 'react-native-fs';

export const readTextFile = async (uri: string, _fileObject?: any): Promise<string> => {
  return RNFS.readFile(uri.replace('file://', ''), 'utf8');
};

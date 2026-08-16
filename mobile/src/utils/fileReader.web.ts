export const readTextFile = async (uri: string, fileObject?: any): Promise<string> => {
  if (fileObject && typeof fileObject.text === 'function') {
    return fileObject.text();
  }
  const res = await fetch(uri);
  return res.text();
};

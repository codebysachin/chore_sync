export const getTestProps = (id: string) => {
  if (__DEV__) {
    return { testID: id };
  }
  return {};
}; 
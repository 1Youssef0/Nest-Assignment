export const createNumericalOtp = (): string => {
  return String(Math.floor(Math.random() * 1000000));
};

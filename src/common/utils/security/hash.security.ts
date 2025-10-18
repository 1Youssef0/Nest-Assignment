import { compare, hash } from 'bcrypt';

export const generateHash = async (
  plainText: string,
  salt_round: number = parseInt(process.env.SALT as string),
): Promise<string> => {
  return await hash(plainText, salt_round);
};

export const compareHash = async (
  plainText: string,
  hashValue: string,
): Promise<boolean> => {
  return await compare(plainText, hashValue);
};

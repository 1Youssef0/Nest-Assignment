import { IResponse } from '../interfaces';
export const successResponse = <T = any>({
  data,
  message = 'done',
  status = 200,
}: IResponse<T> = {}): IResponse<T> => {
  return { message, status, data };
};
 
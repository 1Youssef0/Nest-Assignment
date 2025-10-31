import { Types } from 'mongoose';
import { OtpDocument } from 'src/DB';
import { GenderEnum, ProviderEnum, RoleEnum } from '../enums';
import { IProduct } from './product.interface';

export interface IUser {
  _id?: Types.ObjectId;

  firstName: string;

  lastName: string;

  userName?: string;

  email: string;

  confirmedAt?: Date;

  password?: string;

  provider: ProviderEnum;

  role: RoleEnum;

  gender: GenderEnum;

  preferredLanguage: GenderEnum;

  changeCredentialsTime?: Date;

  otp?: OtpDocument[];

  profilePicture?: string;

  createdAt?: Date;

  updatedAt?: Date;

  wishlist?:Types.ObjectId[] | IProduct[]
}

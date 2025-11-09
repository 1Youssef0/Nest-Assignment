import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Document, Types } from 'mongoose';
import {
  GenderEnum,
  IProduct,
  IUser,
  LanguageEnum,
  ProviderEnum,
  RoleEnum,
} from 'src/common';
import { Otp } from 'src/DB';

registerEnumType(LanguageEnum, {
  name: 'LanguageEnum',
});

registerEnumType(ProviderEnum, {
  name: 'ProviderEnum',
});

registerEnumType(RoleEnum, {
  name: 'RoleEnum',
});

registerEnumType(GenderEnum, {
  name: 'GenderEnum',
});

export class ProfileResponse {
  profile: IUser;
}

@ObjectType()
export class OneUserResponse implements IUser {
  @Field(() => ID)
  _id?: Types.ObjectId;
  @Field(() => Date, { nullable: true })
  changeCredentialsTime?: Date;
  @Field(() => Date, { nullable: true })
  confirmedAt?: Date;
  @Field(() => Date, { nullable: true })
  createdAt?: Date;
  @Field(() => String)
  email: string;
  @Field(() => String, { nullable: true })
  password?: string;
  @Field(() => String)
  firstName: string;
  @Field(() => String)
  lastName: string;

  @Field(() => String, { nullable: true })
  userName?: string;

  @Field(() => String, { nullable: true })
  profilePicture?: string;

  @Field(() => LanguageEnum)
  preferredLanguage: LanguageEnum;

  @Field(() => ProviderEnum)
  provider: ProviderEnum;

  @Field(() => RoleEnum)
  role: RoleEnum;

  @Field(() => GenderEnum)
  gender: GenderEnum;

  @Field(() => [ID], { nullable: true })
  wishlist?: Types.ObjectId[];

  otp?: (Document<unknown, {}, Otp, {}, {}> &
    Otp & { _id: Types.ObjectId } & { __v: number })[];
}

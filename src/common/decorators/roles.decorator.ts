import { SetMetadata } from '@nestjs/common';
import { RoleEnum, TokenEnum } from '../enums';

export const roleName = 'tokenType';
export const Roles = (accessRole: RoleEnum[]) => {
  return SetMetadata(roleName, accessRole);
};

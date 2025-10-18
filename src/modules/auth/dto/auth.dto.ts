import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsMatch } from 'src/common/decorators/match.custom.decorator';

export class ResendConfirmEmailDto {
  @IsEmail()
  email: string;
}

export class ConfirmEmailDto  extends ResendConfirmEmailDto {
  @Matches(/^\d{6}$/)
  code:string
}

export class LoginBodyDto extends ResendConfirmEmailDto {
  @IsStrongPassword()
  password: string;
}

export class SignupBodyDto extends LoginBodyDto {
  @Length(2, 52, {
    message: 'userName min length is 2 char and max length is 52 char',
  })
  @IsNotEmpty()
  @IsString()
  userName: string;

  //   @Validate(MatchBetweenFields, {
  //     message: 'confirm password not identical with password ',
  //   })

  @ValidateIf((data: SignupBodyDto) => {
    return Boolean(data.password);
  })
  @IsMatch<string>(['password'], {
    message: 'confirm password not identical with password ',
  })
  confirmPassword: string;
}

export class SignupQueryDto {
  @MinLength(2)
  @IsString()
  flag: string;
}

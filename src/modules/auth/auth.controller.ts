import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { AuthenticationService } from './auth.service';
import {
  ConfirmEmailDto,
  LoginBodyDto,
  ResendConfirmEmailDto,
  SignupBodyDto,
} from './dto/auth.dto';
import { LoginResponse } from './entities/auth.entity';
import { IResponse, successResponse } from 'src/common';

// @UsePipes(
//      new ValidationPipe({
//       whitelist: true,
//       forbidNonWhitelisted: true,
//       // stopAtFirstError: true,
//       // dismissDefaultMessages:true,
//       // disableErrorMessages:true,
//       // skipMissingProperties:true,
//       // skipNullProperties:true,
//       // skipUndefinedProperties:true,
//     })
// )

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('signup')
  async signup(
    @Body()
    body: SignupBodyDto,
  ): Promise<IResponse> {
    await this.authenticationService.signup(body);
    return successResponse();
  }

  @Post('resend-confirm-email')
  async resendConfirmEmail(
    @Body()
    body: ResendConfirmEmailDto,
  ): Promise<IResponse> {
    await this.authenticationService.resendConfirmEmail(body);
    return successResponse();
  }

  @Patch('confirm-email')
  async confirmEmail(
    @Body()
    body: ConfirmEmailDto,
  ): Promise<IResponse> {
    await this.authenticationService.confirmEmail(body);
    return successResponse();
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginBodyDto): Promise<IResponse<LoginResponse>> {
    const credentials = await this.authenticationService.login(body);
    return successResponse<LoginResponse>({
      message: 'Done',
      data: { credentials },
    });
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  createNumericalOtp,
  emailEvent,
  generateHash,
  IUser,
  LoginCredentialsResponse,
  OtpEnum,
  ProviderEnum,
} from 'src/common';
import {
  ConfirmEmailDto,
  LoginBodyDto,
  ResendConfirmEmailDto,
  SignupBodyDto,
} from './dto/auth.dto';
import { OtpRepository, UserDocument, UserRepository } from 'src/DB';
import { Types } from 'mongoose';
import { SecurityService } from 'src/common/services/security.services';
import { sign } from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from 'src/common/services/token.service';

@Injectable()
export class AuthenticationService {
  private users: IUser[] = [];
  constructor(
    private readonly userRepository: UserRepository,
    private readonly otpRepository: OtpRepository,
    private readonly securityService: SecurityService,
    private readonly tokenService: TokenService,
  ) {}

  private async createConfirmEmailOtp(userId: Types.ObjectId) {
    await this.otpRepository.create({
      data: [
        {
          code: createNumericalOtp(),
          expiredAt: new Date(Date.now() + 2 * 60 * 1000),
          createdBy: userId,
          type: OtpEnum.ConfirmEmail,
        },
      ],
    });
  }

  async signup(data: SignupBodyDto): Promise<string> {
    const { email, password, userName } = data;
    const checkUserExists = await this.userRepository.findOne({
      filter: { email },
    });
    if (checkUserExists) {
      throw new ConflictException('email is already exists');
    }
    const [user] = await this.userRepository.create({
      data: [{ userName, email, password }],
    });

    if (!user) {
      throw new BadRequestException(
        'fail to signup this account , please try again later',
      );
    }

    await this.createConfirmEmailOtp(user._id);
    return 'Done';
  }

  async resendConfirmEmail(data: ResendConfirmEmailDto): Promise<string> {
    const { email } = data;
    const user = await this.userRepository.findOne({
      filter: { email, confirmedAt: { $exists: false } },
      options: {
        populate: [{ path: 'otp', match: { type: OtpEnum.ConfirmEmail } }],
      },
    });
    if (!user) {
      throw new NotFoundException('fail to find matching account');
    }

    if (user.otp?.length) {
      throw new ConflictException(
        `sorry we cant grant you new otp until the existing one become expired ,please try again after ${user.otp[0].expiredAt}`,
      );
    }

    await this.createConfirmEmailOtp(user._id);
    return 'Done';
  }

  async confirmEmail(data: ConfirmEmailDto): Promise<string> {
    const { email, code } = data;
    const user = await this.userRepository.findOne({
      filter: { email, confirmedAt: { $exists: false } },
      options: {
        populate: [{ path: 'otp', match: { type: OtpEnum.ConfirmEmail } }],
      },
    });
    if (!user) {
      throw new NotFoundException('fail to find matching account');
    }

    if (
      !(
        user.otp?.length &&
        (await this.securityService.compareHash(code, user.otp[0].code))
      )
    ) {
      throw new BadRequestException('invalid otp');
    }

    user.confirmedAt = new Date();
    await user.save();
    await this.otpRepository.deleteOne({ filter: { _id: user.otp[0]._id } });

    return 'Done';
  }

  async login(
    data: LoginBodyDto,
  ): Promise<LoginCredentialsResponse> {
    const { email, password } = data;
    const user = await this.userRepository.findOne({
      filter: {
        email,
        confirmedAt: { $exists: true },
        provider: ProviderEnum.SYSTEM,
      },
    });

    if (!user) {
      throw new NotFoundException('fail to find account');
    }

    if (!(await this.securityService.compareHash(password, user.password))) {
      throw new NotFoundException('fail to find account');
    }

    const credentials = await this.tokenService.createLoginCredentials(
      user as UserDocument
    ) ;
    return credentials;
  }
}

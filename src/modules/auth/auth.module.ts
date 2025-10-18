import { Module } from '@nestjs/common';
import { AuthenticationService } from './auth.service';
import { AuthenticationController } from './auth.controller';
import { OtpModel, OtpRepository } from 'src/DB';
import { SecurityService } from 'src/common/services/security.services';

@Module({
  imports: [ OtpModel],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, OtpRepository, SecurityService],
  exports: [],
})
export class AuthenticationModule {}

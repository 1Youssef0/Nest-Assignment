import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthenticationService } from './modules/auth/auth.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authenticationService: AuthenticationService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('hi')
  sayHi(): string {
    return this.appService.getHello();
  }
}

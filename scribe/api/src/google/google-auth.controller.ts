import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Redirect,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthService } from './google-auth.service';

@Controller('auth')
export class GoogleAuthController {
  constructor(
    private readonly googleAuth: GoogleAuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('google')
  @Redirect()
  login() {
    return { url: this.googleAuth.getAuthUrl() };
  }

  @Get('callback')
  async callback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    if (error || !code || !state) {
      throw new BadRequestException(
        `Login cancelado ou recusado${error ? ` (${error})` : ''}.`,
      );
    }

    await this.googleAuth.handleCallback(code, state);

    return 'Conta Google conectada. Pode fechar esta aba.';
  }

  @Get('status')
  status() {
    return { authenticated: this.googleAuth.isAuthenticated() };
  }

  @Get('picker')
  async picker() {
    return {
      accessToken: await this.googleAuth.getPickerToken(),
      // Both are public by design: the Picker sends them from the browser.
      apiKey: this.config.getOrThrow<string>('GOOGLE_API_KEY'),
      appId: this.config.getOrThrow<string>('GOOGLE_APP_ID'),
    };
  }
}

import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Credentials, OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Full read/write access to the user's docs. "drive.file" alone would be
// narrower, but it only covers docs created by this app or picked in the
// Google Picker, which needs it to grant access to the chosen file.
const DOCUMENTS_SCOPE = 'https://www.googleapis.com/auth/documents';
const PICKER_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const SCOPES = [DOCUMENTS_SCOPE, PICKER_SCOPE];

type StoredToken = { refresh_token: string; scope?: string };

@Injectable()
export class GoogleAuthService implements OnModuleInit {
  private readonly logger = new Logger(GoogleAuthService.name);
  private readonly client: OAuth2Client;
  private readonly tokenPath: string;
  private grantedScopes: string[] = [];
  private pendingState?: string;

  constructor(config: ConfigService) {
    this.client = new OAuth2Client({
      clientId: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      redirectUri: config.getOrThrow<string>('GOOGLE_REDIRECT_URI'),
    });
    this.tokenPath = resolve(
      config.get<string>('GOOGLE_TOKEN_PATH', '.google-token.json'),
    );

    // Access tokens last an hour and the client refreshes them on its own;
    // only the refresh token is worth keeping across restarts.
    this.client.on('tokens', (tokens) => void this.saveTokens(tokens));
  }

  async onModuleInit() {
    try {
      const stored = JSON.parse(
        await readFile(this.tokenPath, 'utf8'),
      ) as StoredToken;
      this.client.setCredentials({ refresh_token: stored.refresh_token });
      this.grantedScopes = stored.scope?.split(' ') ?? [DOCUMENTS_SCOPE];
    } catch {
      this.logger.warn(
        'Nenhum login salvo. Acesse /auth/google para conectar sua conta.',
      );
    }
  }

  getAuthUrl() {
    this.pendingState = randomBytes(16).toString('hex');

    return this.client.generateAuthUrl({
      access_type: 'offline',
      // Without "consent", Google skips the refresh token on later logins.
      prompt: 'consent',
      scope: SCOPES,
      state: this.pendingState,
    });
  }

  async handleCallback(code: string, state: string) {
    if (!this.pendingState || state !== this.pendingState) {
      throw new BadRequestException(
        'Login inválido ou expirado. Comece de novo em /auth/google.',
      );
    }
    this.pendingState = undefined;

    const { tokens } = await this.client.getToken(code);
    this.client.setCredentials(tokens);
    await this.saveTokens(tokens);
  }

  isAuthenticated() {
    return Boolean(this.client.credentials.refresh_token);
  }

  getClient() {
    if (!this.isAuthenticated()) {
      throw new UnauthorizedException(
        'Conta Google não conectada. Acesse /auth/google.',
      );
    }

    return this.client;
  }

  // The Google Picker runs in the browser and needs a live access token.
  async getPickerToken() {
    const client = this.getClient();

    if (!this.grantedScopes.includes(PICKER_SCOPE)) {
      throw new UnauthorizedException(
        'Falta autorizar o Google Picker. Conecte de novo em /auth/google.',
      );
    }

    const { token } = await client.getAccessToken();
    if (!token) {
      throw new UnauthorizedException(
        'O Google não devolveu um token. Conecte de novo em /auth/google.',
      );
    }

    return token;
  }

  private async saveTokens(tokens: Credentials) {
    if (!tokens.refresh_token) return;

    if (tokens.scope) this.grantedScopes = tokens.scope.split(' ');

    const stored: StoredToken = {
      refresh_token: tokens.refresh_token,
      scope: this.grantedScopes.join(' '),
    };
    await writeFile(this.tokenPath, JSON.stringify(stored), { mode: 0o600 });
  }
}

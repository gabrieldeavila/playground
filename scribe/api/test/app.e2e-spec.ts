import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client';
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3199/auth/callback';
    process.env.GOOGLE_TOKEN_PATH = 'test/.missing-token.json';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('starts logged out without a saved token', () => {
    return request(app.getHttpServer())
      .get('/auth/status')
      .expect(200)
      .expect({ authenticated: false });
  });

  it('redirects to the Google consent screen', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/google')
      .expect(302);

    const url = new URL(response.headers.location);
    expect(url.host).toBe('accounts.google.com');
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('state')).toMatch(/^[0-9a-f]{32}$/);
  });

  it('rejects a callback whose state was never issued', () => {
    return request(app.getHttpServer())
      .get('/auth/callback?code=abc&state=forged')
      .expect(400);
  });

  it('asks to log in before touching documents', () => {
    return request(app.getHttpServer()).get('/docs/some-id').expect(401);
  });
});

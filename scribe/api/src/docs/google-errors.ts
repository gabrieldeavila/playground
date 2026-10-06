import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

type GoogleError = {
  status?: number;
  message?: string;
  response?: { data?: { error?: unknown } };
};

// Turns Google API failures into HTTP errors the client can act on, instead
// of letting every one of them become a 500.
export function toHttpError(error: unknown): unknown {
  if (error instanceof HttpException) return error;

  const { status, message, response } = (error ?? {}) as GoogleError;

  // The saved refresh token was revoked, or expired: Google drops them after
  // 7 days while the OAuth app is still in "Testing".
  if (response?.data?.error === 'invalid_grant') {
    return new UnauthorizedException(
      'O login com o Google expirou. Conecte de novo em /auth/google.',
    );
  }

  switch (status) {
    case 400:
      return new BadRequestException(message);
    case 401:
      return new UnauthorizedException(
        'O Google recusou as credenciais. Conecte de novo em /auth/google.',
      );
    case 403:
      return new ForbiddenException(
        'Sua conta não tem permissão para editar este documento.',
      );
    case 404:
      return new NotFoundException('Documento não encontrado.');
    default:
      return error;
  }
}

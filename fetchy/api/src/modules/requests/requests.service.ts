import {
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ExecuteRequestDto } from './dto/execute-request.dto';
import { RequestKeyValueDto } from './dto/request-key-value.dto';
import { ExecuteRequestResult } from './interfaces/execute-request-result.interface';

const REQUEST_TIMEOUT_MS = 30_000;

@Injectable()
export class RequestsService {
  async execute(dto: ExecuteRequestDto): Promise<ExecuteRequestResult> {
    const targetUrl = this.buildTargetUrl(dto.url, dto.queryParams);

    const headers = this.toHeaders(dto.headers);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const startedAt = performance.now();

    try {
      const response = await fetch(targetUrl, {
        method: dto.method,
        headers,
        body: this.getRequestBody(dto),
        signal: controller.signal,
        redirect: 'follow',
      });

      const responseBody = await this.parseResponseBody(response);

      return {
        status: response.status,
        statusText: response.statusText,
        responseHeaders: Array.from(response.headers.entries()).map(
          ([key, value]) => ({ key, value }),
        ),
        responseBody,
        duration: Math.round(performance.now() - startedAt),
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new GatewayTimeoutException(
          'The target server did not respond within 30 seconds',
        );
      }

      throw new ServiceUnavailableException(
        'The target server could not be reached',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildTargetUrl(rawUrl: string, query?: RequestKeyValueDto[]): string {
    const targetUrl = new URL(rawUrl);

    for (const item of query ?? []) {
      if (item.enabled !== false) {
        targetUrl.searchParams.append(item.key, item.value);
      }
    }

    return targetUrl.toString();
  }

  private toHeaders(items?: RequestKeyValueDto[]): Headers {
    const headers = new Headers();

    for (const item of items ?? []) {
      if (item.enabled !== false) {
        headers.append(item.key, item.value);
      }
    }

    return headers;
  }

  private getRequestBody(dto: ExecuteRequestDto): string | undefined {
    if (!dto.body || dto.method === 'GET' || dto.method === 'HEAD') {
      return undefined;
    }

    if (dto.body.type === 'json') {
      try {
        JSON.parse(dto.body.content);
      } catch {
        throw new BadRequestException('body.content must contain valid JSON');
      }
    }

    return dto.body.content;
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') ?? '';
    const text = await response.text();

    if (!text) {
      return null;
    }

    if (contentType.toLowerCase().includes('json')) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }

    return text;
  }
}

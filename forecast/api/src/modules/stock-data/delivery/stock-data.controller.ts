import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { CollectStockData } from '../domain/collect-stock-data.js';

interface CollectionRequest {
  tickers: string[];
  startDate: string;
  endDate: string;
}

@Controller('stocks')
export class StockDataController {
  constructor(private readonly collectStockData: CollectStockData) {}

  @Post('data')
  async collect(@Body() body: unknown) {
    const input = parseRequest(body);
    const result = await this.collectStockData.execute(input);

    if (result.savedRows === 0 && result.errors.length > 0) {
      throw new BadGatewayException({
        message: 'Não foi possível coletar dados de nenhum ticker',
        errors: result.errors,
      });
    }

    return {
      ...result,
      files: result.tickers.map((ticker) => `${ticker}.csv`),
    };
  }
}

function parseRequest(body: unknown): CollectionRequest {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestException('O corpo da requisição deve ser um objeto');
  }

  const request = body as Record<string, unknown>;
  if (
    !Array.isArray(request.tickers) ||
    request.tickers.length === 0 ||
    request.tickers.length > 50 ||
    !request.tickers.every(
      (ticker) =>
        typeof ticker === 'string' &&
        /^[a-zA-Z0-9.^_-]{1,20}$/.test(ticker.trim()),
    )
  ) {
    throw new BadRequestException('Informe de 1 a 50 tickers válidos');
  }

  const tickers = [
    ...new Set(
      (request.tickers as string[]).map((ticker) =>
        ticker.trim().toUpperCase(),
      ),
    ),
  ];
  if (
    typeof request.startDate !== 'string' ||
    !isDate(request.startDate) ||
    typeof request.endDate !== 'string' ||
    !isDate(request.endDate) ||
    request.startDate >= request.endDate
  ) {
    throw new BadRequestException(
      'startDate e endDate devem estar no formato YYYY-MM-DD e startDate deve ser anterior a endDate',
    );
  }

  return {
    tickers,
    startDate: request.startDate,
    endDate: request.endDate,
  };
}

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

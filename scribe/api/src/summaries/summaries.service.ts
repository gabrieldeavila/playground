import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocsService } from '../docs/docs.service';
import { summaryToBlocks } from './summary-blocks';
import { type Summary, SummarySchema } from './summary.schema';

const MODEL = 'claude-opus-5-5';

const SYSTEM_PROMPT = `Você resume transcrições de áudio em português do Brasil para quem não ouviu a gravação.

A transcrição foi gerada automaticamente e pode ter palavras trocadas, frases cortadas e trechos repetidos. Interprete pelo contexto, mas não invente fatos, nomes ou números que não estejam no áudio.

Em "nextSteps", liste só tarefas, decisões ou combinados que alguém disse explicitamente. Se não houver nenhum, deixe a lista vazia.`;

type SummarizeInput = {
  transcript: string;
  title: string;
  documentId?: string;
};

@Injectable()
export class SummariesService {
  private readonly logger = new Logger(SummariesService.name);
  private readonly anthropic: Anthropic;

  constructor(
    config: ConfigService,
    private readonly docsService: DocsService,
  ) {
    // Without a key here, the SDK falls back to its usual credential lookup.
    this.anthropic = new Anthropic({
      apiKey: config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async summarizeToDoc({ transcript, title, documentId }: SummarizeInput) {
    // Summarize first so a failure never leaves an empty new document behind.
    const summary = await this.summarize(transcript, title);
    const id =
      documentId ?? (await this.docsService.create(`Resumo: ${title}`)).id;

    const date = new Date().toLocaleDateString('pt-BR');
    const { url } = await this.docsService.appendBlocks(
      id,
      summaryToBlocks(`Resumo: ${title} (${date})`, summary),
    );

    return { id, url, summary };
  }

  private async summarize(transcript: string, title: string): Promise<Summary> {
    const startedAt = Date.now();

    try {
      const response = await this.anthropic.beta.messages.parse({
        model: MODEL,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: SYSTEM_PROMPT,
        output_config: {
          effort: 'medium',
          format: betaZodOutputFormat(SummarySchema),
        },
        messages: [
          {
            role: 'user',
            content: `Título da gravação: ${title}\n\n<transcricao>\n${transcript}\n</transcricao>`,
          },
        ],
      });

      if (response.stop_reason === 'refusal') {
        throw new UnprocessableEntityException(
          'O Claude se recusou a resumir esta transcrição.',
        );
      }

      if (!response.parsed_output) {
        throw new BadGatewayException(
          `O Claude não devolveu um resumo válido (${response.stop_reason}).`,
        );
      }

      this.logger.log(
        `Resumo gerado por ${response.model} em ${Date.now() - startedAt}ms ` +
          `(${response.usage.input_tokens} tokens de entrada, ` +
          `${response.usage.output_tokens} de saída)`,
      );

      return response.parsed_output;
    } catch (error) {
      throw toHttpError(error);
    }
  }
}

function toHttpError(error: unknown): unknown {
  if (error instanceof HttpException) return error;

  if (error instanceof Anthropic.AuthenticationError) {
    return new InternalServerErrorException(
      'Chave da API da Anthropic ausente ou inválida. Confira ANTHROPIC_API_KEY.',
    );
  }

  if (error instanceof Anthropic.RateLimitError) {
    return new HttpException(
      'Limite de uso da API da Anthropic atingido. Tente de novo em instantes.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  if (error instanceof Anthropic.APIError) {
    return new BadGatewayException(
      `A API da Anthropic falhou (${error.status ?? 'sem status'}): ${error.message}`,
    );
  }

  return error;
}

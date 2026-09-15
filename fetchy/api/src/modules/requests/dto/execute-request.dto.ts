import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { RequestAuthDto } from './request-auth.dto';
import { RequestBodyDto } from './request-body.dto';
import { RequestKeyValueDto } from './request-key-value.dto';

export const SUPPORTED_HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const;

export type SupportedHttpMethod = (typeof SUPPORTED_HTTP_METHODS)[number];

export class ExecuteRequestDto {
  @IsIn(SUPPORTED_HTTP_METHODS)
  method!: SupportedHttpMethod;

  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: false,
  })
  url!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestKeyValueDto)
  headers?: RequestKeyValueDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestKeyValueDto)
  queryParams?: RequestKeyValueDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => RequestBodyDto)
  body?: RequestBodyDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => RequestAuthDto)
  auth?: RequestAuthDto;
}

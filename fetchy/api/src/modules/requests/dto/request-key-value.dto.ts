import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestKeyValueDto {
  @IsString()
  @MaxLength(8_192)
  key!: string;

  @IsString()
  @MaxLength(1_000_000)
  value!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

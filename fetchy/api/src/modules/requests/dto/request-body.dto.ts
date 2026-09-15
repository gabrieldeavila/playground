import { IsIn, IsString, MaxLength } from 'class-validator';

export class RequestBodyDto {
  @IsIn(['json', 'text'])
  type!: 'json' | 'text';

  @IsString()
  @MaxLength(1_000_000)
  content!: string;
}

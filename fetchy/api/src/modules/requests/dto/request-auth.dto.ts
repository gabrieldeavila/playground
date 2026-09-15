import { IsIn } from 'class-validator';

export class RequestAuthDto {
  @IsIn(['none'])
  type!: 'none';
}

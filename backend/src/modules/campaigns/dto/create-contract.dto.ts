import { IsString, IsUUID, IsISO8601, IsOptional, MaxLength, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum ContractStatus {
  draft = 'draft',
  active = 'active',
  completed = 'completed',
  cancelled = 'cancelled',
}

export class CreateContractDto {
  @IsUUID()
  people_id: string;

  @IsString()
  @MaxLength(255)
  description: string;

  @IsString()
  object: string;

  @Type(() => Number)
  @IsNumber()
  value: number;

  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @IsISO8601()
  @IsOptional()
  start_date?: string;

  @IsISO8601()
  @IsOptional()
  end_date?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  tse_code?: string;
}

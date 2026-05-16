import { IsString, IsOptional, MaxLength, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum TseItemDirection {
  income = 'income',
  expense = 'expense',
}

export class CreateTseReportItemDto {
  @IsString()
  @MaxLength(20)
  tse_code: string;

  @IsEnum(TseItemDirection)
  direction: TseItemDirection;

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsString()
  @MaxLength(255)
  description: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  reference_date?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

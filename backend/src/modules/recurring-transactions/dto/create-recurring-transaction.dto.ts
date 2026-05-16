import {
  IsString,
  IsEnum,
  IsInt,
  IsPositive,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType, TransactionContext } from '../../financial/dto/create-transaction.dto';

export class CreateRecurringTransactionDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  person_id: number;

  @IsString()
  @MaxLength(255)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(TransactionContext)
  @IsOptional()
  context?: TransactionContext;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  category_id: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  cost_center_id?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  campaign_id?: number;

  /** Dia do mês para vencimento das transações geradas (1–28) */
  @IsInt()
  @Min(1)
  @Max(28)
  @Type(() => Number)
  day_of_month: number;

  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  start_month: number;

  @IsInt()
  @Min(2000)
  @Type(() => Number)
  start_year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  @Type(() => Number)
  end_month?: number;

  @IsInt()
  @Min(2000)
  @IsOptional()
  @Type(() => Number)
  end_year?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

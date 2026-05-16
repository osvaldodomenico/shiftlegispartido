import {
  IsString,
  IsEnum,
  IsInt,
  IsPositive,
  IsISO8601,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType, TransactionContext } from './create-transaction.dto';

/**
 * Todos os campos opcionais.
 * Regras de negócio:
 * - Apenas transações em status draft ou pending_approval podem ser editadas livremente.
 * - Período fechado bloqueia qualquer edição.
 * - Mudanças de status ocorrem via endpoints dedicados (approve/reject/pay/cancel).
 */
export class UpdateTransactionDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  @Type(() => Number)
  amount?: number;

  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @IsEnum(TransactionContext)
  @IsOptional()
  context?: TransactionContext;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  campaign_id?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  category_id?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  cost_center_id?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  competency_month?: number;

  @IsInt()
  @Min(2000)
  @IsOptional()
  @Type(() => Number)
  competency_year?: number;

  @IsISO8601()
  @IsOptional()
  due_date?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  person_id?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

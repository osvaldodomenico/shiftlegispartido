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
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum TransactionStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum TransactionContext {
  DIRETORIO = 'diretorio',
  PARTIDARIO = 'partidario',
  CAMPANHA = 'campanha',
}

export enum TransactionOrigin {
  MANUAL = 'manual',
  RECURRING = 'recurring',
  DONATION = 'donation',
  CONTRIBUTION = 'contribution',
  IMPORTED = 'imported',
}

export class CreateTransactionDto {
  @IsString()
  @MaxLength(255)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor deve ter no máximo 2 casas decimais' })
  @Min(0.01, { message: 'Valor deve ser maior que zero' })
  @Type(() => Number)
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(TransactionContext)
  @IsOptional()
  context?: TransactionContext;

  @IsEnum(TransactionOrigin)
  @IsOptional()
  origin?: TransactionOrigin;

  /** Obrigatório quando context = campanha */
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  @ValidateIf((o) => o.context === TransactionContext.CAMPANHA)
  campaign_id?: number;

  /** FK para financial_categories — obrigatório */
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  category_id: number;

  /** FK para cost_centers — opcional */
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  cost_center_id?: number;

  /** Mês de competência (1–12) */
  @IsInt()
  @Min(1)
  @Type(() => Number)
  competency_month: number;

  /** Ano de competência (ex: 2026) */
  @IsInt()
  @Min(2000)
  @Type(() => Number)
  competency_year: number;

  @IsISO8601({}, { message: 'due_date deve ser uma data válida (ISO 8601)' })
  due_date: string;

  @IsOptional()
  @IsISO8601({}, { message: 'paid_at deve ser uma data válida (ISO 8601)' })
  paid_at?: string;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  person_id: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

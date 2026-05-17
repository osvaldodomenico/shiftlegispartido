import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsISO8601,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum StatementType {
  CREDITO = 'credito',
  DEBITO = 'debito',
}

export class CreateStatementDto {
  @IsISO8601({}, { message: 'date deve ser uma data válida (ISO 8601)' })
  date: string;

  @IsString()
  @MaxLength(500)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  amount: number;

  @IsEnum(StatementType)
  type: StatementType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Type(() => Number)
  balance_after?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

import {
  IsInt,
  IsPositive,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ContributionFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

export class CreateContributionDto {
  /** ID do filiado/contribuinte — deve pertencer ao tenant */
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  person_id: number;

  /** Valor recorrente da contribuição */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  /** Frequência de geração das cobranças */
  @IsEnum(ContributionFrequency)
  frequency: ContributionFrequency;

  /** Data de início da recorrência (YYYY-MM-DD) */
  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  /** Data de encerramento — null = indeterminado */
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsOptional()
  notes?: string;
}

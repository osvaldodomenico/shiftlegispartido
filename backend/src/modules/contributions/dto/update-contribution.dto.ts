import { IsNumber, IsEnum, IsOptional, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ContributionStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

export class UpdateContributionDto {
  /** Novo valor recorrente */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  @Type(() => Number)
  amount?: number;

  /** Alterar status da recorrência */
  @IsEnum(ContributionStatus)
  @IsOptional()
  status?: ContributionStatus;

  /** Data de encerramento da recorrência */
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsOptional()
  notes?: string;
}

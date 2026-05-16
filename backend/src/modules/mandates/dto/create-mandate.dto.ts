import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsInt,
  IsPositive,
  MaxLength,
} from 'class-validator';

// Espelha o enum mandate_status do Prisma
export enum MandateStatus {
  ACTIVE = 'active',
  FINISHED = 'finished',
  RENOUNCED = 'renounced',
  REVOKED = 'revoked',
  SUSPENDED = 'suspended',
}

export class CreateMandateDto {
  @IsInt()
  @IsPositive()
  person_id: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  campaign_id?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  position: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  jurisdiction: string;

  @IsDateString()
  start_date: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsEnum(MandateStatus)
  status?: MandateStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

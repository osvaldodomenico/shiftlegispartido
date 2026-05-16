import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsInt,
  IsBoolean,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

// Espelha o enum election_scope do Prisma
export enum ElectionScope {
  MUNICIPAL = 'municipal',
  ESTADUAL = 'estadual',
  FEDERAL = 'federal',
  DISTRITAL = 'distrital',
}

export class CreateElectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @IsEnum(ElectionScope)
  scope: ElectionScope;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  election_date?: string;

  @IsOptional()
  @IsDateString()
  runoff_date?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

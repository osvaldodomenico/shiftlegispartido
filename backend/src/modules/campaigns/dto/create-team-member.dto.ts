import { IsString, IsUUID, IsISO8601, IsOptional, MaxLength, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum TeamMemberRole {
  coordenador = 'coordenador',
  tesoureiro = 'tesoureiro',
  cabo_eleitoral = 'cabo_eleitoral',
  voluntario = 'voluntario',
  assessor = 'assessor',
  motorista = 'motorista',
  outro = 'outro',
}

export enum TeamMemberPaymentType {
  voluntario = 'voluntario',
  clt = 'clt',
  autonomo = 'autonomo',
  contrato = 'contrato',
}

export class CreateTeamMemberDto {
  @IsUUID()
  people_id: string;

  @IsEnum(TeamMemberRole)
  role: TeamMemberRole;

  @IsEnum(TeamMemberPaymentType)
  @IsOptional()
  payment_type?: TeamMemberPaymentType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salary?: number;

  @IsISO8601()
  start_date: string;

  @IsISO8601()
  @IsOptional()
  end_date?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

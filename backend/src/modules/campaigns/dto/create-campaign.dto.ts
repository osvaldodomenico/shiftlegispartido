import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum CampaignStatus {
  planejamento = 'planejamento',
  ativa = 'ativa',
  suspensa = 'suspensa',
  encerrada = 'encerrada',
}

export class CreateCampaignDto {
  @IsUUID()
  election_id: string;

  @IsUUID()
  people_id: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(100)
  office: string;

  @IsOptional()
  @Type(() => Number)
  budget?: number;
}

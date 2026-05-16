import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateEntryDto {
  @IsUUID()
  people_id: string;

  @IsUUID()
  stage_id: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

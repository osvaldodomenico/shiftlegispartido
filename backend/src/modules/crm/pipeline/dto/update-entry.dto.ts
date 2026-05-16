import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateEntryDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  exited_at?: string;
}

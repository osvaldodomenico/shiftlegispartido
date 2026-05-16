import { IsString, IsISO8601, IsOptional, MaxLength, IsEnum } from 'class-validator';

export enum TseReportType {
  parcial = 'parcial',
  final = 'final',
  suplementar = 'suplementar',
}

export enum TseReportStatus {
  draft = 'draft',
  submitted = 'submitted',
  accepted = 'accepted',
  rejected = 'rejected',
}

export class CreateTseReportDto {
  @IsEnum(TseReportType)
  type: TseReportType;

  @IsString()
  @MaxLength(50)
  reference: string;

  @IsISO8601()
  period_start: string;

  @IsISO8601()
  period_end: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

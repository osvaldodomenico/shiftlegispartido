import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, MaxLength } from 'class-validator';
import { CreateTseReportDto } from './create-tse-report.dto';

export class UpdateTseReportDto extends PartialType(CreateTseReportDto) {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  tse_protocol?: string;
}

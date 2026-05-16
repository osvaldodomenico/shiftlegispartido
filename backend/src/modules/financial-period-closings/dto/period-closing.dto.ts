import { IsInt, Min, Max, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class ClosePeriodDto {
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month: number;

  @IsInt()
  @Min(2000)
  @Type(() => Number)
  year: number;
}

export class ReopenPeriodDto extends ClosePeriodDto {
  @IsString()
  @MaxLength(500)
  reason: string;
}

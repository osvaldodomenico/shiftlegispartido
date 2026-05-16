import { IsISO8601, IsOptional, IsNumber, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContractPaymentDto {
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsISO8601()
  due_date: string;

  @IsISO8601()
  @IsOptional()
  paid_at?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  notes?: string;
}

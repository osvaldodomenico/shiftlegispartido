import { IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class ReconcileStatementDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  transaction_id: number;
}

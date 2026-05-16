import { IsString, IsOptional, IsISO8601, MaxLength } from 'class-validator';

/** Usado em approve, reject, cancel — reason é obrigatório apenas em reject/cancel */
export class TransitionReasonDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}

export class RejectTransactionDto {
  @IsString()
  @MaxLength(500)
  reason: string;
}

export class CancelTransactionDto {
  @IsString()
  @MaxLength(500)
  reason: string;
}

export class PayTransactionDto {
  @IsISO8601()
  @IsOptional()
  paid_at?: string;
}

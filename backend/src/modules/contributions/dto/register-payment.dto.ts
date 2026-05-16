import {
  IsDateString,
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  PIX = 'pix',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  BOLETO = 'boleto',
  CARD = 'card',
}

export class RegisterPaymentDto {
  /** Data do pagamento — default: hoje */
  @IsDateString()
  @IsOptional()
  paid_at?: string;

  /**
   * Valor efetivamente pago.
   * Pode diferir do valor recorrente (ex: pagamento parcial ou com acréscimo).
   * Se omitido, usa o amount da contribution.
   */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  @Type(() => Number)
  amount_paid?: number;

  @IsEnum(PaymentMethod)
  @IsOptional()
  payment_method?: PaymentMethod;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

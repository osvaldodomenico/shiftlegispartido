import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BankAccountType {
  CORRENTE = 'corrente',
  POUPANCA = 'poupanca',
  CAMPANHA = 'campanha',
}

export class CreateBankAccountDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(100)
  bank_name: string;

  @IsString()
  @MaxLength(10)
  @IsOptional()
  bank_code?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  agency?: string;

  @IsString()
  @MaxLength(30)
  account_number: string;

  @IsEnum(BankAccountType)
  type: BankAccountType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  initial_balance?: number;
}

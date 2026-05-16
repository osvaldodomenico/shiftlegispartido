import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsInt,
  IsPositive,
  IsISO8601,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PersonType {
  FILIADO = 'filiado',
  FORNECEDOR = 'fornecedor',
  FUNCIONARIO = 'funcionario',
  CANDIDATO = 'candidato',
  DOADOR = 'doador',
  VOLUNTARIO = 'voluntario',
}

export enum PersonStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class CreatePersonDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  /**
   * CPF aceito com ou sem formatação: "123.456.789-09" ou "12345678909"
   * Validação de dígitos verificadores ocorre no service via validateCpf().
   */
  @IsString()
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, { message: 'CPF inválido' })
  cpf: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsEnum(PersonType, { message: 'Tipo inválido' })
  type: PersonType;

  @IsOptional()
  @IsEnum(PersonStatus, { message: 'Status inválido' })
  status?: PersonStatus;

  /** Vínculo opcional com conta de usuário */
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  userId?: number;

  @IsOptional()
  @IsISO8601()
  birthdate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  zipCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

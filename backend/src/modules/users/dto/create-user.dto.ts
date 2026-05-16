import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsArray,
  IsInt,
  IsPositive,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsString()
  // Pula validação de tamanho se a senha já estiver hashada (bcrypt hash começa com $2b$)
  @ValidateIf((o) => !o.password?.startsWith('$2b$'))
  @MinLength(8, { message: 'Senha deve ter ao menos 8 caracteres' })
  password: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'Status inválido. Use: active | inactive' })
  status?: UserStatus;

  /**
   * IDs dos perfis (roles) a atribuir ao usuário.
   * Roles devem pertencer ao mesmo tenant.
   * Usado para RBAC.
   */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  roleIds?: number[];
}

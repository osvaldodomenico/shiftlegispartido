import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/**
 * Todos os campos de CreateUserDto se tornam opcionais.
 * Password opcional: se fornecido, será rehasheado e token_version será incrementado.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}

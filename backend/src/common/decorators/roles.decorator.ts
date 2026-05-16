import { SetMetadata } from '@nestjs/common';

/**
 * Define os roles necessários para acessar a rota.
 * O RolesGuard valida contra os roles que vêm no JWT.
 *
 * Uso: @Roles('admin') ou @Roles('admin', 'manager')
 * Semântica OR: o usuário precisa ter PELO MENOS UM dos roles listados.
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

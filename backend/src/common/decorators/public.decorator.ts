import { SetMetadata } from '@nestjs/common';

/**
 * Marca a rota como pública — dispensa JWT e RBAC.
 * Usar em endpoints como POST /auth/login.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

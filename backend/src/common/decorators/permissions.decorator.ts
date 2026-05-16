import { SetMetadata } from '@nestjs/common';

/**
 * Define as permissões finas necessárias para acessar a rota.
 * O RolesGuard carrega as permissões do usuário via DB (com cache no request).
 *
 * Uso: @Permissions('users.delete') ou @Permissions('finance.view', 'finance.edit')
 * Semântica AND: o usuário precisa ter TODAS as permissões listadas.
 *
 * Convenção de nomenclatura: <módulo>.<ação>
 * Exemplos: users.create | users.delete | finance.view | documents.sign
 */
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

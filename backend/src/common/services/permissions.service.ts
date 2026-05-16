import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Regras de segurança aplicadas em TODAS as queries:
 * 1. Usuário deve estar ativo e não-deletado (users.deleted_at IS NULL, status = active)
 * 2. Role deve pertencer ao tenant do usuário (cross-tenant bloqueado)
 * 3. Role não pode estar deletada (roles.deleted_at IS NULL)
 * 4. Cache é por request E por userId+tenantId — nunca compartilhado entre usuários
 */
@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Roles ──────────────────────────────────────────────────────────────────

  /**
   * Retorna os nomes das roles ativas do usuário no banco.
   * Não confia no JWT — verifica a situação atual do usuário e das roles.
   */
  async getActiveRolesForUser(userId: number, tenantId: number): Promise<string[]> {
    const user = await this.prisma.users.findFirst({
      where: { id: userId, tenant_id: tenantId, deleted_at: null, status: 'active' },
      select: { id: true },
    });

    if (!user) return [];

    const userRoles = await this.prisma.user_roles.findMany({
      where: {
        user_id: userId,
        roles: {
          tenant_id: tenantId,
          deleted_at: null,   // role não pode estar deletada
        },
      },
      select: {
        roles: { select: { name: true } },
      },
    });

    const roles = new Set<string>(['member']);
    for (const ur of userRoles) roles.add(ur.roles.name);
    return Array.from(roles);
  }

  /**
   * Versão cacheada de getActiveRolesForUser.
   * Chave de cache inclui userId e tenantId — nunca reutiliza entre usuários.
   */
  async getCachedRoles(
    request: any,
    userId: number,
    tenantId: number,
  ): Promise<string[]> {
    const key = `_rolesCache_${userId}_${tenantId}`;
    if (Array.isArray(request[key])) return request[key];

    const roles = await this.getActiveRolesForUser(userId, tenantId);
    request[key] = roles;
    return roles;
  }

  // ── Permissions ────────────────────────────────────────────────────────────

  /**
   * Retorna o Set de key_names de permissões do usuário.
   * Aplica todas as regras de segurança: usuário ativo, role ativa, mesmo tenant.
   */
  async getPermissionsForUser(
    userId: number,
    tenantId: number,
  ): Promise<Set<string>> {
    const user = await this.prisma.users.findFirst({
      where: { id: userId, tenant_id: tenantId, deleted_at: null, status: 'active' },
      select: { id: true },
    });

    if (!user) return new Set();

    const userRoles = await this.prisma.user_roles.findMany({
      where: {
        user_id: userId,
        roles: {
          tenant_id: tenantId,
          deleted_at: null,   // ignora roles deletadas
        },
      },
      select: {
        roles: {
          select: {
            role_permissions: {
              select: {
                permission: { select: { key_name: true } },
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.roles.role_permissions) {
        permissions.add(rp.permission.key_name);
      }
    }
    return permissions;
  }

  /**
   * Versão cacheada de getPermissionsForUser.
   * Chave de cache inclui userId e tenantId — nunca reutiliza entre usuários.
   */
  async getCachedPermissions(
    request: any,
    userId: number,
    tenantId: number,
  ): Promise<Set<string>> {
    const key = `_permissionsCache_${userId}_${tenantId}`;
    if (request[key] instanceof Set) return request[key];

    const permissions = await this.getPermissionsForUser(userId, tenantId);
    request[key] = permissions;
    return permissions;
  }
}

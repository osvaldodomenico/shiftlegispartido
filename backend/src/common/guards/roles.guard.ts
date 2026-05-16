import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionsService } from '../services/permissions.service';
import { JwtPayload } from '../decorators/current-user.decorator';

/**
 * Guard global de RBAC — executa APÓS JwtAuthGuard (request.user populado).
 *
 * Fluxo:
 * 1. Rota @Public → passa sempre
 * 2. Sem @Roles / @Permissions → passa (sem restrição)
 * 3. Valida tenantId do JWT (obrigatório antes de qualquer verificação)
 * 4. @Roles → consulta DB (não confia apenas no token)
 * 5. @Permissions → consulta DB com cache keyed por userId+tenantId
 * 6. Ambos → AND lógico (usuário precisa satisfazer os dois)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ── 1. Rotas públicas dispensam RBAC ─────────────────────────────────────
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // ── 2. Sem restrição RBAC → permite acesso ────────────────────────────────
    if (!requiredRoles?.length && !requiredPermissions?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) throw new ForbiddenException('Usuário não autenticado');

    // ── 3. Validação de tenantId (obrigatória antes de qualquer verificação) ──
    if (
      !user.tenantId ||
      !Number.isInteger(user.tenantId) ||
      user.tenantId <= 0
    ) {
      throw new ForbiddenException('Token inválido: tenantId ausente ou malformado');
    }

    if (!user.userId || !Number.isInteger(user.userId) || user.userId <= 0) {
      throw new ForbiddenException('Token inválido: userId ausente ou malformado');
    }

    // ── 4. Validação de Roles via DB (não confia apenas no token) ─────────────
    // O token pode estar stale: o usuário pode ter perdido a role desde o login.
    // getCachedRoles verifica: usuário ativo, role ativa, mesmo tenant.
    if (requiredRoles?.length) {
      const dbRoles = await this.permissionsService.getCachedRoles(
        request,
        user.userId,
        user.tenantId,
      );

      const hasRole = requiredRoles.some((role) => dbRoles.includes(role));
      if (!hasRole) {
        throw new ForbiddenException(
          `Acesso negado. Perfis necessários: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // ── 5. Validação de Permissions via DB com cache ──────────────────────────
    // getCachedPermissions filtra: usuário ativo, roles não-deletadas, mesmo tenant.
    if (requiredPermissions?.length) {
      const userPermissions = await this.permissionsService.getCachedPermissions(
        request,
        user.userId,
        user.tenantId,
      );

      const missing = requiredPermissions.filter((p) => !userPermissions.has(p));
      if (missing.length > 0) {
        throw new ForbiddenException(
          `Acesso negado. Permissões ausentes: ${missing.join(', ')}`,
        );
      }
    }

    return true;
  }
}

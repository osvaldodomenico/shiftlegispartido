import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_ROUNDS = 12;

/**
 * Campos seguros para retorno — nunca expõe password_hash.
 * Reutilizado em todos os métodos do service.
 */
const USER_SAFE_SELECT = {
  id: true,
  tenant_id: true,
  name: true,
  email: true,
  cpf: true,
  status: true,
  two_factor_enabled: true,
  last_login_at: true,
  last_password_change: true,
  token_version: true,
  created_at: true,
  updated_at: true,
  user_roles: {
    select: {
      roles: {
        select: { id: true, name: true },
      },
    },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────────

  async create(dto: CreateUserDto, actor: JwtPayload) {
    const emailExists = await this.prisma.users.findFirst({
      where: { email: dto.email, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (emailExists) {
      throw new ConflictException('E-mail já cadastrado neste tenant');
    }

    if (dto.roleIds?.length) {
      await this.assertRolesBelongToTenant(dto.roleIds, actor.tenantId);
      await this.assertNoEscalation(dto.roleIds, actor);
    }

    // Se já for um hash bcrypt, usa diretamente; senão, gera o hash
    const password_hash = dto.password.startsWith('$2b$')
      ? dto.password
      : await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.users.create({
      data: {
        tenant_id: actor.tenantId,
        name: dto.name,
        email: dto.email,
        cpf: dto.cpf ?? null,
        password_hash,
        status: dto.status ?? 'active',
        last_password_change: new Date(),
        token_version: 0,
        user_roles: dto.roleIds?.length
          ? { create: dto.roleIds.map((roleId) => ({ role_id: roleId })) }
          : undefined,
      },
      select: USER_SAFE_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'CREATE_USER',
      entityId: Number(user.id),
      metadata: { email: user.email, name: user.name },
    });

    return { data: this.format(user), message: 'Usuário criado com sucesso' };
  }

  async findAll(
    tenantId: number,
    page: number = 1,
    limit: number = 10,
    status?: string,
  ) {
    const where = {
      tenant_id: tenantId,
      deleted_at: null,
      ...(status ? { status: status as any } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.users.findMany({
        where,
        select: USER_SAFE_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.users.count({ where }),
    ]);

    return {
      data: {
        items: items.map(this.format),
        pagination: { page, limit, total },
      },
      message: '',
    };
  }

  async findOne(id: number, tenantId: number) {
    const user = await this.prisma.users.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: USER_SAFE_SELECT,
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    return { data: this.format(user), message: '' };
  }

  async update(id: number, dto: UpdateUserDto, actor: JwtPayload) {
    const existing = await this.prisma.users.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Usuário não encontrado');

    if (dto.email && dto.email !== existing.email) {
      const emailConflict = await this.prisma.users.findFirst({
        where: {
          email: dto.email,
          tenant_id: actor.tenantId,
          deleted_at: null,
          NOT: { id },
        },
      });
      if (emailConflict) throw new ConflictException('E-mail já está em uso');
    }

    if (dto.roleIds?.length) {
      await this.assertRolesBelongToTenant(dto.roleIds, actor.tenantId);
      await this.assertNoEscalation(dto.roleIds, actor);
    }

    // Dados base da atualização
    const updateData: Record<string, any> = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.cpf !== undefined && { cpf: dto.cpf }),
      ...(dto.status !== undefined && { status: dto.status }),
    };

    // Troca de senha: rehash + atualiza last_password_change + bump token_version
    if (dto.password) {
      updateData.password_hash = dto.password.startsWith('$2b$')
        ? dto.password
        : await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
      updateData.last_password_change = new Date();
      updateData.token_version = { increment: 1 };
    }

    // Atualização de roles: deleta as antigas e insere as novas (replace completo)
    if (dto.roleIds !== undefined) {
      await this.prisma.user_roles.deleteMany({ where: { user_id: id } });
      if (dto.roleIds.length) {
        await this.prisma.user_roles.createMany({
          data: dto.roleIds.map((roleId) => ({ user_id: id, role_id: roleId })),
        });
      }
    }

    // updateMany garante atomicamente que só afeta registros não-deletados do tenant correto.
    // Evita race condition entre o guard findFirst e a escrita.
    const { count } = await this.prisma.users.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: updateData,
    });

    if (count === 0) {
      throw new NotFoundException('Usuário não encontrado ou já foi excluído');
    }

    const user = await this.prisma.users.findFirst({
      where: { id, tenant_id: actor.tenantId },
      select: USER_SAFE_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'UPDATE_USER',
      entityId: id,
      metadata: { fields: Object.keys(dto) },
    });

    return { data: this.format(user), message: 'Usuário atualizado com sucesso' };
  }

  async remove(id: number, actor: JwtPayload) {
    const existing = await this.prisma.users.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Usuário não encontrado');

    // Impede auto-exclusão
    if (id === actor.userId) {
      throw new BadRequestException('Você não pode excluir seu próprio usuário');
    }

    // updateMany garante atomicamente que só deleta registros não-deletados do tenant correto.
    const { count } = await this.prisma.users.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });

    if (count === 0) {
      throw new NotFoundException('Usuário não encontrado ou já foi excluído');
    }

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'DELETE_USER',
      entityId: id,
      metadata: { email: existing.email },
    });

    return { data: null, message: 'Usuário removido com sucesso' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MÉTODOS USADOS INTERNAMENTE PELO AUTH MODULE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Busca por email para login — sem filtro de tenant_id (ainda desconhecido).
   * Retorna password_hash pois é necessário para bcrypt.compare no AuthService.
   */
  async findByEmail(email: string) {
    return this.prisma.users.findFirst({
      where: { email, deleted_at: null },
      include: {
        user_roles: { include: { roles: true } },
      },
    });
  }

  /**
   * Busca segura pós-autenticação — sempre filtra tenant_id, nunca retorna password_hash.
   */
  async findById(userId: number, tenantId: number) {
    return this.prisma.users.findFirst({
      where: { id: userId, tenant_id: tenantId, deleted_at: null },
      select: USER_SAFE_SELECT,
    });
  }

  async updateLastLogin(userId: number): Promise<void> {
    await this.prisma.users.update({
      where: { id: userId },
      data: { last_login_at: new Date() },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Normaliza BigInt → number e achata a estrutura de roles.
   */
  private format(user: any) {
    return {
      id: Number(user.id),
      tenantId: Number(user.tenant_id),
      name: user.name,
      email: user.email,
      cpf: user.cpf,          // TODO: descriptografar quando criptografia de CPF for implementada
      status: user.status,
      twoFactorEnabled: user.two_factor_enabled,
      lastLoginAt: user.last_login_at,
      lastPasswordChange: user.last_password_change,
      tokenVersion: user.token_version,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      roles: (user.user_roles ?? []).map((ur: any) => ({
        id: Number(ur.roles.id),
        name: ur.roles.name,
      })),
    };
  }

  /**
   * Impede escalonamento de privilégio: o ator só pode atribuir roles que ele
   * mesmo possui no banco (não no token — o token pode estar stale).
   * Exceção: admins (role 'admin') podem atribuir qualquer role do tenant.
   */
  private async assertNoEscalation(
    roleIds: number[],
    actor: JwtPayload,
  ): Promise<void> {
    const actorRoles = await this.prisma.user_roles.findMany({
      where: {
        user_id: actor.userId,
        roles: { tenant_id: actor.tenantId, deleted_at: null },
      },
      select: {
        role_id: true,
        roles: { select: { name: true } },
      },
    });

    // Admins podem atribuir qualquer role do tenant
    const isAdmin = actorRoles.some((ur) => ur.roles.name === 'admin');
    if (isAdmin) return;

    const actorRoleIds = new Set(actorRoles.map((ur) => Number(ur.role_id)));
    const forbidden = roleIds.filter((id) => !actorRoleIds.has(id));

    if (forbidden.length > 0) {
      throw new ForbiddenException(
        'Você não pode atribuir perfis que você mesmo não possui',
      );
    }
  }

  private async assertRolesBelongToTenant(
    roleIds: number[],
    tenantId: number,
  ): Promise<void> {
    const count = await this.prisma.roles.count({
      where: { id: { in: roleIds }, tenant_id: tenantId },
    });
    if (count !== roleIds.length) {
      throw new BadRequestException(
        'Um ou mais perfis não pertencem a este tenant',
      );
    }
  }

  private async audit(params: {
    tenantId: number;
    userId: number;
    action: string;
    entityId: number;
    metadata?: object;
  }): Promise<void> {
    await this.prisma.audit_logs.create({
      data: {
        tenant_id: params.tenantId,
        user_id: params.userId,
        action: params.action,
        entity: 'users',
        entity_id: params.entityId,
        metadata: params.metadata ?? {},
      },
    });
  }
}

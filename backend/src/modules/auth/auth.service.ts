import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Request } from 'express';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(dto: LoginDto, req: Request) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.status !== 'active') {
      throw new ForbiddenException('Usuário inativo ou bloqueado');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const roles = user.user_roles.map((ur) => ur.roles.name);

    const payload: JwtPayload = {
      userId: Number(user.id),
      tenantId: Number(user.tenant_id),
      roles,
    };

    const accessToken = this.jwtService.sign(payload);

    // Gera refresh token com prefixo userId para lookup eficiente (evita full table scan)
    // Formato: "{userId}.{randomBase64url}" — o prefixo é extraído na validação
    const rawRefreshToken = `${user.id}.${this.generateRawToken()}`;
    const refreshTokenHash = await bcrypt.hash(rawRefreshToken, 10);
    const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

    await Promise.all([
      // Persiste hash do refresh token (nunca o valor bruto)
      this.prisma.users.update({
        where: { id: user.id },
        data: {
          refresh_token_hash: refreshTokenHash,
          refresh_token_expires_at: refreshTokenExpiresAt,
        },
      }),
      this.usersService.updateLastLogin(Number(user.id)),
      this.registrarAuditoria({
        tenantId: Number(user.tenant_id),
        userId: Number(user.id),
        action: 'LOGIN',
        entity: 'users',
        entityId: Number(user.id),
        ipAddress: req.ip ?? req.socket?.remoteAddress ?? 'unknown',
        metadata: { email: user.email },
      }),
    ]);

    return {
      data: {
        access_token: accessToken,
        refresh_token: rawRefreshToken,
      },
      message: 'Login realizado com sucesso',
    };
  }

  async me(currentUser: JwtPayload) {
    const user = await this.usersService.findById(currentUser.userId, currentUser.tenantId);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const roles = user.user_roles.map((ur) => ({
      id: Number(ur.roles.id),
      name: ur.roles.name,
    }));

    return {
      data: {
        id: Number(user.id),
        tenantId: Number(user.tenant_id),
        name: user.name,
        email: user.email,
        status: user.status,
        twoFactorEnabled: user.two_factor_enabled,
        lastLoginAt: user.last_login_at,
        roles,
      },
      message: '',
    };
  }

  /**
   * Valida o refresh_token bruto contra o hash armazenado e retorna novo access_token.
   * Regras:
   *  - prefixo userId deve ser um número válido
   *  - hash deve conferir (bcrypt.compare)
   *  - refresh_token_expires_at não pode estar no passado
   *  - usuário deve estar ativo
   * Em caso de sucesso, rotaciona o refresh_token (novo hash gravado no banco).
   */
  async refreshToken(rawRefreshToken: string): Promise<{ data: { access_token: string; refresh_token: string }; message: string }> {
    // Extrai userId do prefixo para lookup eficiente
    const [userIdStr] = rawRefreshToken.split('.');
    const userId = Number(userIdStr);

    if (!userId || isNaN(userId)) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const user = await this.prisma.users.findFirst({
      where: {
        id: userId,
        deleted_at: null,
        refresh_token_hash: { not: null },
      },
      include: {
        user_roles: {
          where: { deleted_at: null },
          include: { roles: true },
        },
      },
    });

    if (!user || !user.refresh_token_hash) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Valida hash
    const tokenValid = await bcrypt.compare(rawRefreshToken, user.refresh_token_hash);
    if (!tokenValid) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Valida expiração
    if (!user.refresh_token_expires_at || user.refresh_token_expires_at < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    // Valida status do usuário
    if (user.status !== 'active') {
      throw new UnauthorizedException('Usuário inativo ou bloqueado');
    }

    // Rotaciona o refresh token (gera novo par)
    const newRawRefreshToken = `${user.id}.${this.generateRawToken()}`;
    const newRefreshTokenHash = await bcrypt.hash(newRawRefreshToken, 10);
    const newRefreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const roles = user.user_roles.map((ur) => ur.roles.name);

    const payload: JwtPayload = {
      userId: Number(user.id),
      tenantId: Number(user.tenant_id),
      roles,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        refresh_token_hash: newRefreshTokenHash,
        refresh_token_expires_at: newRefreshTokenExpiresAt,
      },
    });

    await this.registrarAuditoria({
      tenantId: Number(user.tenant_id),
      userId: Number(user.id),
      action: 'REFRESH_TOKEN',
      entity: 'users',
      entityId: Number(user.id),
      ipAddress: 'api',
      metadata: {},
    });

    return {
      data: {
        access_token: accessToken,
        refresh_token: newRawRefreshToken,
      },
      message: 'Token renovado com sucesso',
    };
  }

  /**
   * Invalida o refresh_token limpando o hash no banco.
   * O token bruto é validado antes da invalidação para evitar logout de terceiros.
   * Retorna sucesso mesmo com token inválido — evita enumeração de usuários.
   */
  async logout(rawRefreshToken: string): Promise<{ data: null; message: string }> {
    const [userIdStr] = rawRefreshToken.split('.');
    const userId = Number(userIdStr);

    if (!userId || isNaN(userId)) {
      // Retorna sucesso mesmo com token inválido — evita enumeração de usuários
      return { data: null, message: 'Logout realizado com sucesso' };
    }

    const user = await this.prisma.users.findFirst({
      where: {
        id: userId,
        deleted_at: null,
        refresh_token_hash: { not: null },
      },
    });

    if (user?.refresh_token_hash) {
      const tokenValid = await bcrypt.compare(rawRefreshToken, user.refresh_token_hash);

      if (tokenValid) {
        await this.prisma.users.update({
          where: { id: userId },
          data: {
            refresh_token_hash: null,
            refresh_token_expires_at: null,
          },
        });

        await this.registrarAuditoria({
          tenantId: Number(user.tenant_id),
          userId: Number(user.id),
          action: 'LOGOUT',
          entity: 'users',
          entityId: Number(user.id),
          ipAddress: 'api',
          metadata: {},
        });
      }
    }

    return { data: null, message: 'Logout realizado com sucesso' };
  }

  /**
   * Gera a parte aleatória do refresh token.
   * O chamador concatena o userId como prefixo: `${userId}.${generateRawToken()}`.
   */
  private generateRawToken(): string {
    return randomBytes(40).toString('base64url');
  }

  private async registrarAuditoria(params: {
    tenantId: number;
    userId: number;
    action: string;
    entity: string;
    entityId: number;
    ipAddress: string;
    metadata?: object;
  }): Promise<void> {
    await this.prisma.audit_logs.create({
      data: {
        tenant_id: params.tenantId,
        user_id: params.userId,
        action: params.action,
        entity: params.entity,
        entity_id: params.entityId,
        ip_address: params.ipAddress,
        metadata: params.metadata ?? {},
      },
    });
  }
}

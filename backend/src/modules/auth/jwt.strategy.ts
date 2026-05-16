import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { authConfig } from '../../config/auth.config';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfig.jwt.secret,
    });
  }

  /**
   * Chamado automaticamente pelo Passport após validar a assinatura do token.
   * O retorno é injetado em request.user pelo JwtAuthGuard.
   * tenantId SEMPRE vem do token — nunca do request body.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.userId || !payload.tenantId) {
      throw new UnauthorizedException('Token inválido');
    }
    return {
      userId: payload.userId,
      tenantId: payload.tenantId,
      roles: payload.roles ?? [],
    };
  }
}

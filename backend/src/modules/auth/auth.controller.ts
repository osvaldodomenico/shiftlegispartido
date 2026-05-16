import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Rota pública — dispensa JWT e RBAC.
   * JwtAuthGuard e RolesGuard são pulados via @Public().
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  /**
   * Rota protegida globalmente pelo JwtAuthGuard (APP_GUARD).
   * Não precisa de @UseGuards explícito.
   */
  @Get('me')
  me(@CurrentUser() currentUser: JwtPayload) {
    return this.authService.me(currentUser);
  }

  /**
   * Renova o access_token usando um refresh_token válido.
   * @Public — não requer JWT no header (o refresh_token é a credencial).
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  /**
   * Invalida o refresh_token (logout explícito).
   * @Public — o refresh_token expirado/inválido não deve impedir o logout.
   */
  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refreshToken);
  }
}

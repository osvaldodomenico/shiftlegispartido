import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

// Notificações são geradas pelo sistema — sem POST público
// Apenas leitura e marcação de lidas permitidas ao usuário final
@Controller('crm/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('read') read?: string,
  ) {
    // Converte query param string para booleano se fornecido
    const readFilter =
      read === 'true' ? true : read === 'false' ? false : undefined;
    return this.notificationsService.findAll(actor, { read: readFilter });
  }

  @Get('unread-count')
  countUnread(@CurrentUser() actor: JwtPayload) {
    return this.notificationsService.countUnread(actor);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.notificationsService.markRead(id, actor);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() actor: JwtPayload) {
    return this.notificationsService.markAllRead(actor);
  }
}

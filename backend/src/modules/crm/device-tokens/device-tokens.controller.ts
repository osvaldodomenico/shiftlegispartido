import { Controller, Post, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { DeviceTokensService } from './device-tokens.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

@Controller('crm/device-tokens')
export class DeviceTokensController {
  constructor(private readonly deviceTokensService: DeviceTokensService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDeviceTokenDto, @CurrentUser() actor: JwtPayload) {
    return this.deviceTokensService.register(dto, actor);
  }

  @Delete(':token')
  @HttpCode(HttpStatus.OK)
  unregister(@Param('token') token: string, @CurrentUser() actor: JwtPayload) {
    return this.deviceTokensService.unregister(token, actor);
  }
}

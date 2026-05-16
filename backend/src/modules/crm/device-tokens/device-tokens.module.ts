import { Module } from '@nestjs/common';
import { DeviceTokensController } from './device-tokens.controller';
import { DeviceTokensService } from './device-tokens.service';
import { PrismaService } from '../../../database/prisma.service';

@Module({
  controllers: [DeviceTokensController],
  providers: [DeviceTokensService, PrismaService],
  exports: [DeviceTokensService],
})
export class DeviceTokensModule {}

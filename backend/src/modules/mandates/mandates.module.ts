import { Module } from '@nestjs/common';
import { MandatesService } from './mandates.service';
import { MandatesController } from './mandates.controller';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from '../../common/services/permissions.service';

@Module({
  controllers: [MandatesController],
  providers: [MandatesService, PrismaService, PermissionsService],
  exports: [MandatesService],
})
export class MandatesModule {}

import { Module } from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { ElectionsController } from './elections.controller';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from '../../common/services/permissions.service';

@Module({
  controllers: [ElectionsController],
  providers: [ElectionsService, PrismaService, PermissionsService],
  exports: [ElectionsService],
})
export class ElectionsModule {}

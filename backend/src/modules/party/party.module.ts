import { Module } from '@nestjs/common';
import { PartyService } from './party.service';
import { PartyController } from './party.controller';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from '../../common/services/permissions.service';

@Module({
  controllers: [PartyController],
  providers: [PartyService, PrismaService, PermissionsService],
  exports: [PartyService],
})
export class PartyModule {}

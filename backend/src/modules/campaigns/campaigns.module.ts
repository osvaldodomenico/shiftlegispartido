import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from '../../common/services/permissions.service';

@Module({
  controllers: [CampaignsController],
  providers: [CampaignsService, PrismaService, PermissionsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}

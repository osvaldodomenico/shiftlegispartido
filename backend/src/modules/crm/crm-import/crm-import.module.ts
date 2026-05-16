import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CrmImportController } from './crm-import.controller';
import { CrmImportService } from './crm-import.service';
import { PrismaService } from '../../../database/prisma.service';

@Module({
  imports: [MulterModule.register()],
  controllers: [CrmImportController],
  providers: [CrmImportService, PrismaService],
  exports: [CrmImportService],
})
export class CrmImportsModule {}

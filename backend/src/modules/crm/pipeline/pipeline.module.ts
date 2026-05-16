import { Module } from '@nestjs/common';
import { PipelineStagesController } from './pipeline-stages.controller';
import { PipelineEntriesController } from './pipeline-entries.controller';
import { PipelineService } from './pipeline.service';
import { PrismaService } from '../../../database/prisma.service';

@Module({
  controllers: [PipelineStagesController, PipelineEntriesController],
  providers: [PipelineService, PrismaService],
  exports: [PipelineService],
})
export class PipelineModule {}

import { Module } from '@nestjs/common';
import { ContributionsController } from './contributions.controller';
import { ContributionsService } from './contributions.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [ContributionsController],
  providers: [ContributionsService, PrismaService],
  exports: [ContributionsService],
})
export class ContributionsModule {}

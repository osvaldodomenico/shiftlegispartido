import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { PeopleTagsController } from './people-tags.controller';
import { TagsService } from './tags.service';
import { PrismaService } from '../../../database/prisma.service';

@Module({
  controllers: [TagsController, PeopleTagsController],
  providers: [TagsService, PrismaService],
  exports: [TagsService],
})
export class TagsModule {}

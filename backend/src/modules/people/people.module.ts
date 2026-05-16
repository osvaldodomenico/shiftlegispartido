import { Module } from '@nestjs/common';
import { PeopleService } from './people.service';
import { PeopleController } from './people.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [PeopleController],
  providers: [PeopleService, PrismaService],
  exports: [PeopleService],
})
export class PeopleModule {}

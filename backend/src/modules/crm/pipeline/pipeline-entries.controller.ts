import {
  Controller, Get, Post, Patch,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

@Controller('crm/pipeline/entries')
export class PipelineEntriesController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEntryDto, @CurrentUser() actor: JwtPayload) {
    return this.pipelineService.createEntry(dto, actor);
  }

  @Get()
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('stage_id') stageId?: string,
    @Query('people_id') peopleId?: string,
  ) {
    return this.pipelineService.findAllEntries(actor.tenantId, stageId, peopleId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEntryDto, @CurrentUser() actor: JwtPayload) {
    return this.pipelineService.updateEntry(id, dto, actor);
  }
}

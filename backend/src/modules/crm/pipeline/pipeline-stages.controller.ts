import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

@Controller('crm/pipeline/stages')
export class PipelineStagesController {
  constructor(private readonly pipelineService: PipelineService) {}

  // ATENÇÃO: rota estática /order deve vir ANTES de /:id
  @Post('order')
  @HttpCode(HttpStatus.OK)
  reorder(@Body() dto: ReorderStagesDto, @CurrentUser() actor: JwtPayload) {
    return this.pipelineService.reorderStages(dto, actor);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateStageDto, @CurrentUser() actor: JwtPayload) {
    return this.pipelineService.createStage(dto, actor);
  }

  @Get()
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.pipelineService.findAllStages(actor.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStageDto, @CurrentUser() actor: JwtPayload) {
    return this.pipelineService.updateStage(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.pipelineService.removeStage(id, actor);
  }
}

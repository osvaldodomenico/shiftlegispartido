import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';
import { task_status } from '@prisma/client';

@Controller('crm/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTaskDto, @CurrentUser() actor: JwtPayload) {
    return this.tasksService.create(dto, actor);
  }

  @Get()
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('assigned_to') assignedTo?: string,
    @Query('status') status?: task_status,
    @Query('person_id') personId?: string,
  ) {
    return this.tasksService.findAll(actor.tenantId, {
      assigned_to: assignedTo,
      status,
      person_id: personId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.tasksService.findOne(id, actor.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.tasksService.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.tasksService.remove(id, actor);
  }
}

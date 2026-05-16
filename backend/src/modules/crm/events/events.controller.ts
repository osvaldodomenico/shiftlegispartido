import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AddAttendeesDto } from './dto/add-attendees.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import {
  CurrentUser,
  JwtPayload,
} from '../../../common/decorators/current-user.decorator';

@Controller('crm/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEventDto, @CurrentUser() actor: JwtPayload) {
    return this.eventsService.create(dto, actor);
  }

  @Get()
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('start_from') startFrom?: string,
    @Query('start_to') startTo?: string,
  ) {
    return this.eventsService.findAll(actor.tenantId, startFrom, startTo);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.eventsService.findOne(id, actor.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.eventsService.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.eventsService.remove(id, actor);
  }

  @Post(':id/attendees')
  @HttpCode(HttpStatus.CREATED)
  addAttendees(
    @Param('id') eventId: string,
    @Body() dto: AddAttendeesDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.eventsService.addAttendees(eventId, dto, actor);
  }

  @Patch(':id/attendees/:personId')
  updateAttendance(
    @Param('id') eventId: string,
    @Param('personId') personId: string,
    @Body() dto: UpdateAttendanceDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.eventsService.updateAttendance(eventId, personId, dto, actor);
  }

  @Delete(':id/attendees/:personId')
  @HttpCode(HttpStatus.OK)
  removeAttendee(
    @Param('id') eventId: string,
    @Param('personId') personId: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.eventsService.removeAttendee(eventId, personId, actor);
  }
}

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

// Interações são append-only: não há PATCH, PUT nem DELETE endpoints
@Controller('crm/interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInteractionDto, @CurrentUser() actor: JwtPayload) {
    return this.interactionsService.create(dto, actor);
  }

  @Get()
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('person_id') personId?: string,
  ) {
    return this.interactionsService.findAll(actor.tenantId, personId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.interactionsService.findOne(id, actor.tenantId);
  }
}

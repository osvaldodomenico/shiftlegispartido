import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PeopleService } from './people.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * JWT protegido globalmente via APP_GUARD.
 * DELETE restrito a admin e manager.
 */
@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreatePersonDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.peopleService.create(dto, actor);
  }

  @Get()
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('name') name?: string,
    @Query('cpf') cpf?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.peopleService.findAll(actor.tenantId, page, limit, name, cpf, status, type);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.peopleService.findOne(id, actor.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePersonDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.peopleService.update(id, dto, actor);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.peopleService.remove(id, actor);
  }
}

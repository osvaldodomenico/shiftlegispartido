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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * JWT protegido globalmente via APP_GUARD (JwtAuthGuard).
 * Não é necessário @UseGuards em nenhuma rota.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.usersService.create(dto, actor);
  }

  @Get()
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('status') status?: string,
  ) {
    return this.usersService.findAll(actor.tenantId, page, limit, status);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.usersService.findOne(id, actor.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.usersService.update(id, dto, actor);
  }

  /**
   * Apenas usuários com role 'admin' podem excluir.
   * RolesGuard valida contra roles[] do JWT — sem query ao banco.
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.usersService.remove(id, actor);
  }
}

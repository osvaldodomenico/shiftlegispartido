import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CostCentersService } from './cost-centers.service';
import { CreateCostCenterDto } from './dto/create-cost-center.dto';
import { UpdateCostCenterDto } from './dto/update-cost-center.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('cost-centers')
export class CostCentersController {
  constructor(private readonly costCentersService: CostCentersService) {}

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCostCenterDto, @CurrentUser() actor: JwtPayload) {
    return this.costCentersService.create(dto, actor);
  }

  /**
   * Filtros:
   *   ?is_active=true|false
   *   ?name=adm
   */
  @Get()
  @Roles('member', 'admin')
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('is_active') is_active?: string,
    @Query('name') name?: string,
  ) {
    const isActiveFilter =
      is_active === 'true' ? true : is_active === 'false' ? false : undefined;

    return this.costCentersService.findAll(actor.tenantId, { is_active: isActiveFilter, name });
  }

  @Get(':id')
  @Roles('member', 'admin')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: JwtPayload) {
    return this.costCentersService.findOne(id, actor.tenantId);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCostCenterDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.costCentersService.update(id, dto, actor);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: JwtPayload) {
    return this.costCentersService.remove(id, actor);
  }
}

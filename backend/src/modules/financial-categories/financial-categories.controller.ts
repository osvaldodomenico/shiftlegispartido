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
import { FinancialCategoriesService } from './financial-categories.service';
import { CreateFinancialCategoryDto } from './dto/create-financial-category.dto';
import { UpdateFinancialCategoryDto } from './dto/update-financial-category.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('finance/categories')
export class FinancialCategoriesController {
  constructor(private readonly categoriesService: FinancialCategoriesService) {}

  /**
   * Cria categoria. Apenas admin pode criar/alterar categorias
   * pois elas afetam a classificação de todos os lançamentos do tenant.
   */
  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateFinancialCategoryDto, @CurrentUser() actor: JwtPayload) {
    return this.categoriesService.create(dto, actor);
  }

  /**
   * Lista categorias com filtros opcionais.
   * Disponível para todos os usuários autenticados (necessário para preencher selects).
   *
   * Filtros:
   *   ?type=income|expense|both
   *   ?is_active=true|false
   */
  @Get()
  @Roles('member', 'admin')
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('type') type?: string,
    @Query('is_active') is_active?: string,
  ) {
    const isActiveFilter =
      is_active === 'true' ? true : is_active === 'false' ? false : undefined;

    return this.categoriesService.findAll(actor.tenantId, { type, is_active: isActiveFilter });
  }

  /**
   * Detalha categoria com filhos diretos incluídos.
   */
  @Get(':id')
  @Roles('member', 'admin')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: JwtPayload) {
    return this.categoriesService.findOne(id, actor.tenantId);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFinancialCategoryDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.categoriesService.update(id, dto, actor);
  }

  /**
   * Soft delete — bloqueado se categoria tem subcategorias ativas.
   */
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: JwtPayload) {
    return this.categoriesService.remove(id, actor);
  }
}

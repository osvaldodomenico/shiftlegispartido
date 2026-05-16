import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateDocumentVersionDto } from './dto/create-document-version.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Cria documento + versão 1 atomicamente.
   * Role mínima: member (qualquer usuário autenticado pode criar).
   */
  @Post()
  @Roles('member', 'admin')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateDocumentDto, @CurrentUser() actor: JwtPayload) {
    return this.documentsService.create(dto, actor);
  }

  /**
   * Adiciona nova versão ao documento.
   * Histórico é imutável — versões anteriores nunca são sobrescritas.
   */
  @Post(':id/version')
  @Roles('member', 'admin')
  @HttpCode(HttpStatus.CREATED)
  addVersion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateDocumentVersionDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.documentsService.addVersion(id, dto, actor);
  }

  /**
   * Lista documentos do tenant com paginação e filtros opcionais.
   * Filtros: type, entity_type, entity_id
   */
  @Get()
  @Roles('member', 'admin')
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('type') type?: string,
    @Query('entity_type') entity_type?: string,
    @Query('entity_id', new DefaultValuePipe(undefined)) entity_id?: string,
  ) {
    return this.documentsService.findAll(actor.tenantId, page, limit, {
      type,
      entity_type,
      entity_id: entity_id ? parseInt(entity_id, 10) : undefined,
    });
  }

  /**
   * Busca documento por ID — valida tenant_id (proíbe acesso cross-tenant).
   */
  @Get(':id')
  @Roles('member', 'admin')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.documentsService.findOne(id, actor.tenantId);
  }

  /**
   * Lista histórico de versões — imutável, em ordem decrescente.
   */
  @Get(':id/versions')
  @Roles('member', 'admin')
  findVersions(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.documentsService.findVersions(id, actor.tenantId);
  }

  /**
   * Soft delete — versões permanecem para auditoria.
   */
  @Delete(':id')
  @Roles('admin')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.documentsService.remove(id, actor);
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateDocumentDto, EntityType } from './dto/create-document.dto';
import { CreateDocumentVersionDto } from './dto/create-document-version.dto';

/**
 * Campos comuns de versão — reutilizados em selects aninhados e standalone.
 */
const VERSION_SELECT_CORE = {
  id: true,
  document_id: true,
  version: true,
  file_url: true,
  mime_type: true,
  size: true,
  is_signed: true,
  created_by: true,
  created_at: true,
} as const;

const DOCUMENT_SELECT = {
  id: true,
  tenant_id: true,
  name: true,
  type: true,
  entity_type: true,
  entity_id: true,
  current_version_id: true,
  created_by: true,
  created_at: true,
  updated_at: true,
  current_version: {
    select: VERSION_SELECT_CORE,
  },
} as const;

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Cria documento + versão 1 atomicamente via $transaction.
   *
   * Fluxo (3 passos dentro da transaction):
   *   1. INSERT documents (current_version_id = null)
   *   2. INSERT document_versions (version = 1)
   *   3. UPDATE documents SET current_version_id = <versão criada>
   *
   * Garante que nunca exista documento sem ao menos uma versão.
   */
  async create(dto: CreateDocumentDto, actor: JwtPayload) {
    await this.assertEntityBelongsToTenant(dto.entity_type, dto.entity_id ?? null, actor.tenantId);

    const doc = await this.prisma.$transaction(async (tx) => {
      // 1. Cria o documento sem versão — current_version_id será preenchido no passo 3
      const document = await tx.documents.create({
        data: {
          tenant_id: actor.tenantId,
          name: dto.name,
          type: dto.type as any,
          entity_type: dto.entity_type as any,
          entity_id: dto.entity_id ?? null,
          current_version_id: null,
          created_by: actor.userId,
        },
      });

      // 2. Cria versão 1 — imutável após criação
      const version = await tx.document_versions.create({
        data: {
          document_id: document.id,
          version: 1,
          file_url: dto.file_url,
          mime_type: dto.mime_type,
          size: dto.size,
          is_signed: false,
          created_by: actor.userId,
        },
      });

      // 3. Aponta current_version_id → versão recém-criada
      const updated = await tx.documents.update({
        where: { id: document.id },
        data: { current_version_id: version.id },
        select: DOCUMENT_SELECT,
      });

      return updated;
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'CREATE_DOCUMENT',
      entityId: Number(doc.id),
      metadata: { name: doc.name, type: doc.type, entity_type: doc.entity_type },
    });

    return { data: this.format(doc), message: 'Documento criado com sucesso' };
  }

  /**
   * Adiciona nova versão ao documento existente.
   *
   * Regras críticas:
   * - Histórico é imutável: versões anteriores nunca são alteradas
   * - Número de versão = MAX(version) + 1, calculado dentro da transaction
   * - current_version_id é atualizado atomicamente
   * - @@unique([document_id, version]) no schema previne versões duplicadas
   *   em caso de requisições concorrentes (resulta em erro P2002, não em corrupção)
   */
  async addVersion(documentId: number, dto: CreateDocumentVersionDto, actor: JwtPayload) {
    const doc = await this.prisma.documents.findFirst({
      where: { id: documentId, tenant_id: actor.tenantId, deleted_at: null },
      select: { id: true, name: true },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');

    const version = await this.prisma.$transaction(async (tx) => {
      // Calcula próximo número de versão — dentro da transaction para consistência
      const agg = await tx.document_versions.aggregate({
        where: { document_id: documentId },
        _max: { version: true },
      });
      const nextVersion = (agg._max.version ?? 0) + 1;

      // Cria nova versão (imutável após inserção)
      const newVersion = await tx.document_versions.create({
        data: {
          document_id: documentId,
          version: nextVersion,
          file_url: dto.file_url,
          mime_type: dto.mime_type,
          size: dto.size,
          is_signed: false,
          created_by: actor.userId,
        },
        select: VERSION_SELECT_CORE,
      });

      // Atualiza ponteiro — versão anterior permanece no histórico
      await tx.documents.update({
        where: { id: documentId },
        data: { current_version_id: newVersion.id },
      });

      return newVersion;
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'ADD_DOCUMENT_VERSION',
      entityId: Number(documentId),
      metadata: { version: version.version, mime_type: version.mime_type },
    });

    return {
      data: this.formatVersion(version),
      message: `Versão ${version.version} adicionada com sucesso`,
    };
  }

  async findAll(
    tenantId: number,
    page = 1,
    limit = 10,
    filters: {
      type?: string;
      entity_type?: string;
      entity_id?: number;
    } = {},
  ) {
    const where = this.buildWhere(tenantId, filters);

    const [items, total] = await Promise.all([
      this.prisma.documents.findMany({
        where,
        select: DOCUMENT_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.documents.count({ where }),
    ]);

    return {
      data: {
        items: items.map(this.format),
        pagination: { page, limit, total },
      },
      message: '',
    };
  }

  async findOne(id: number, tenantId: number) {
    const doc = await this.prisma.documents.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: DOCUMENT_SELECT,
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');

    return { data: this.format(doc), message: '' };
  }

  /**
   * Retorna o histórico completo de versões em ordem decrescente.
   * Versões são imutáveis — o histórico nunca é alterado retroativamente.
   */
  async findVersions(documentId: number, tenantId: number) {
    // Valida tenant antes de expor versões
    const doc = await this.prisma.documents.findFirst({
      where: { id: documentId, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');

    const versions = await this.prisma.document_versions.findMany({
      where: { document_id: documentId },
      select: VERSION_SELECT_CORE,
      orderBy: { version: 'desc' },
    });

    return {
      data: { items: versions.map(this.formatVersion) },
      message: '',
    };
  }

  /**
   * Soft delete — document_versions NÃO são afetadas.
   * O histórico de versões permanece intacto para fins de auditoria.
   */
  async remove(id: number, actor: JwtPayload) {
    const existing = await this.prisma.documents.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      select: { id: true, name: true },
    });
    if (!existing) throw new NotFoundException('Documento não encontrado');

    const { count } = await this.prisma.documents.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });

    if (count === 0) throw new NotFoundException('Documento não encontrado ou já excluído');

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'DELETE_DOCUMENT',
      entityId: id,
      metadata: { name: existing.name },
    });

    return { data: null, message: 'Documento removido com sucesso' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Valida que a entidade referenciada existe e pertence ao tenant.
   *
   * - people    → valida em people (tenant_id + deleted_at)
   * - financial → valida em transactions (tenant_id + deleted_at)
   * - campaign  → módulo ainda não implementado, aceita sem validação
   * - general   → sem entity_id obrigatório, ignora validação
   */
  private async assertEntityBelongsToTenant(
    entityType: string,
    entityId: number | null,
    tenantId: number,
  ): Promise<void> {
    if (entityType === EntityType.GENERAL || entityId === null) return;

    switch (entityType) {
      case EntityType.PEOPLE: {
        const person = await this.prisma.people.findFirst({
          where: { id: entityId, tenant_id: tenantId, deleted_at: null },
          select: { id: true },
        });
        if (!person) throw new BadRequestException('Pessoa não encontrada neste tenant');
        break;
      }
      case EntityType.FINANCIAL: {
        const tx = await this.prisma.transactions.findFirst({
          where: { id: entityId, tenant_id: tenantId, deleted_at: null },
          select: { id: true },
        });
        if (!tx) throw new BadRequestException('Lançamento financeiro não encontrado neste tenant');
        break;
      }
      case EntityType.CAMPAIGN:
        // Módulo ainda não implementado — aceitar sem validação
        break;
    }
  }

  private buildWhere(
    tenantId: number,
    filters: { type?: string; entity_type?: string; entity_id?: number },
  ) {
    const where: Record<string, any> = {
      tenant_id: tenantId,
      deleted_at: null,
    };

    if (filters.type) where.type = filters.type;
    if (filters.entity_type) where.entity_type = filters.entity_type;
    if (filters.entity_id) where.entity_id = filters.entity_id;

    return where;
  }

  private format(doc: any) {
    return {
      id: Number(doc.id),
      tenantId: Number(doc.tenant_id),
      name: doc.name,
      type: doc.type,
      entityType: doc.entity_type,
      entityId: doc.entity_id !== null ? Number(doc.entity_id) : null,
      currentVersionId: doc.current_version_id !== null ? Number(doc.current_version_id) : null,
      currentVersion: doc.current_version ? this.formatVersion(doc.current_version) : null,
      createdBy: Number(doc.created_by),
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    };
  }

  private formatVersion(v: any) {
    return {
      id: Number(v.id),
      documentId: Number(v.document_id),
      version: v.version,
      fileUrl: v.file_url,
      mimeType: v.mime_type,
      size: v.size,
      isSigned: v.is_signed,
      createdBy: Number(v.created_by),
      createdAt: v.created_at,
    };
  }

  private async audit(params: {
    tenantId: number;
    userId: number;
    action: string;
    entityId: number;
    metadata?: object;
  }): Promise<void> {
    await this.prisma.audit_logs.create({
      data: {
        tenant_id: params.tenantId,
        user_id: params.userId,
        action: params.action,
        entity: 'documents',
        entity_id: params.entityId,
        metadata: params.metadata ?? {},
      },
    });
  }
}

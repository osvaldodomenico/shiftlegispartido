import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { AddChapterMemberDto } from './dto/add-chapter-member.dto';
import { CreateOrganDto } from './dto/create-organ.dto';
import { UpdateOrganDto } from './dto/update-organ.dto';
import { AddOrganMemberDto } from './dto/add-organ-member.dto';

// ─── Seleções seguras — nunca expõe campos sensíveis ─────────────────────────

const CHAPTER_SAFE_SELECT = {
  id: true,
  tenant_id: true,
  name: true,
  level: true,
  state: true,
  city: true,
  zone: true,
  parent_id: true,
  is_active: true,
  created_by: true,
  created_at: true,
  updated_at: true,
} as const;

const CHAPTER_MEMBER_SELECT = {
  id: true,
  chapter_id: true,
  person_id: true,
  tenant_id: true,
  role: true,
  joined_at: true,
  left_at: true,
  person: { select: { id: true, name: true, email: true } },
} as const;

const ORGAN_SAFE_SELECT = {
  id: true,
  tenant_id: true,
  name: true,
  description: true,
  is_active: true,
  created_by: true,
  created_at: true,
  updated_at: true,
} as const;

const ORGAN_MEMBER_SELECT = {
  id: true,
  organ_id: true,
  person_id: true,
  tenant_id: true,
  role: true,
  joined_at: true,
  left_at: true,
  person: { select: { id: true, name: true, email: true } },
} as const;

// ─── Utilitário: serializa BigInt para string nos objetos de resposta ─────────
function serializeBigInt(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      result[k] = serializeBigInt(v);
    }
    return result;
  }
  return obj;
}

@Injectable()
export class PartyService {
  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // CAPÍTULOS (DIRETÓRIOS PARTIDÁRIOS)
  // ═══════════════════════════════════════════════════════════════════════════

  async createChapter(dto: CreateChapterDto, actor: JwtPayload) {
    const chapter = await this.prisma.party_chapters.create({
      data: {
        tenant_id: actor.tenantId,
        name: dto.name,
        level: dto.level,
        state: dto.state ?? null,
        city: dto.city ?? null,
        zone: dto.zone ?? null,
        parent_id: dto.parent_id ? BigInt(dto.parent_id) : null,
        created_by: actor.userId,
      },
      select: CHAPTER_SAFE_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'CREATE_CHAPTER',
      entityId: chapter.id,
      metadata: { name: dto.name, level: dto.level },
    });

    return { data: serializeBigInt(chapter), message: 'Diretório criado com sucesso' };
  }

  /**
   * Retorna todos os capítulos raiz (parent_id = null) com seus filhos aninhados.
   * Estrutura em árvore para exibição hierárquica.
   */
  async findAllChapters(actor: JwtPayload) {
    const all = await this.prisma.party_chapters.findMany({
      where: { tenant_id: actor.tenantId, deleted_at: null },
      select: {
        ...CHAPTER_SAFE_SELECT,
        children: {
          where: { deleted_at: null },
          select: {
            ...CHAPTER_SAFE_SELECT,
            children: {
              where: { deleted_at: null },
              select: {
                ...CHAPTER_SAFE_SELECT,
                children: {
                  where: { deleted_at: null },
                  select: CHAPTER_SAFE_SELECT,
                },
              },
            },
          },
        },
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    // Retorna apenas raízes — filhos já vêm aninhados pela query
    const roots = all.filter((c) => c.parent_id === null);

    return { data: serializeBigInt(roots), message: '' };
  }

  async findOneChapter(id: bigint, tenantId: number) {
    const chapter = await this.prisma.party_chapters.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: {
        ...CHAPTER_SAFE_SELECT,
        members: {
          where: { left_at: null },
          select: CHAPTER_MEMBER_SELECT,
        },
        children: {
          where: { deleted_at: null },
          select: CHAPTER_SAFE_SELECT,
        },
      },
    });

    if (!chapter) throw new NotFoundException('Diretório não encontrado');
    return { data: serializeBigInt(chapter), message: '' };
  }

  async updateChapter(id: string, dto: UpdateChapterDto, actor: JwtPayload) {
    const bigId = BigInt(id);

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.level !== undefined) updateData.level = dto.level;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.zone !== undefined) updateData.zone = dto.zone;
    if (dto.parent_id !== undefined) {
      updateData.parent_id = dto.parent_id ? BigInt(dto.parent_id) : null;
    }

    const { count } = await this.prisma.party_chapters.updateMany({
      where: { id: bigId, tenant_id: actor.tenantId, deleted_at: null },
      data: updateData,
    });

    if (count === 0) throw new NotFoundException('Diretório não encontrado ou já excluído');

    const updated = await this.prisma.party_chapters.findFirst({
      where: { id: bigId },
      select: CHAPTER_SAFE_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'UPDATE_CHAPTER',
      entityId: bigId,
      metadata: { fields: Object.keys(dto) },
    });

    return { data: serializeBigInt(updated), message: 'Diretório atualizado com sucesso' };
  }

  async removeChapter(id: string, actor: JwtPayload) {
    const bigId = BigInt(id);

    const { count } = await this.prisma.party_chapters.updateMany({
      where: { id: bigId, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });

    if (count === 0) throw new NotFoundException('Diretório não encontrado ou já excluído');

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'DELETE_CHAPTER',
      entityId: bigId,
      metadata: {},
    });

    return { data: null, message: 'Diretório removido com sucesso' };
  }

  // ─── Membros de capítulo ──────────────────────────────────────────────────

  async addChapterMember(chapterId: string, dto: AddChapterMemberDto, actor: JwtPayload) {
    const bigChapterId = BigInt(chapterId);
    const bigPersonId = BigInt(dto.person_id);

    // Valida que o capítulo pertence ao tenant
    const chapter = await this.prisma.party_chapters.findFirst({
      where: { id: bigChapterId, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!chapter) throw new NotFoundException('Diretório não encontrado');

    // Impede duplicata ativa
    const existing = await this.prisma.chapter_members.findFirst({
      where: {
        chapter_id: bigChapterId,
        person_id: bigPersonId,
        tenant_id: actor.tenantId,
        left_at: null,
      },
    });
    if (existing) throw new ConflictException('Pessoa já é membro ativo deste diretório');

    const member = await this.prisma.chapter_members.create({
      data: {
        chapter_id: bigChapterId,
        person_id: bigPersonId,
        tenant_id: actor.tenantId,
        role: dto.role ?? null,
        joined_at: new Date(dto.joined_at),
      },
      select: CHAPTER_MEMBER_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'ADD_CHAPTER_MEMBER',
      entityId: bigChapterId,
      metadata: { person_id: dto.person_id, role: dto.role },
    });

    return { data: serializeBigInt(member), message: 'Membro adicionado ao diretório' };
  }

  async listChapterMembers(chapterId: string, actor: JwtPayload) {
    const bigChapterId = BigInt(chapterId);

    const chapter = await this.prisma.party_chapters.findFirst({
      where: { id: bigChapterId, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!chapter) throw new NotFoundException('Diretório não encontrado');

    const members = await this.prisma.chapter_members.findMany({
      where: { chapter_id: bigChapterId, tenant_id: actor.tenantId, left_at: null },
      select: CHAPTER_MEMBER_SELECT,
      orderBy: { joined_at: 'asc' },
    });

    return { data: serializeBigInt(members), message: '' };
  }

  async removeChapterMember(chapterId: string, memberId: string, actor: JwtPayload) {
    const bigChapterId = BigInt(chapterId);
    const bigMemberId = BigInt(memberId);

    const { count } = await this.prisma.chapter_members.updateMany({
      where: {
        id: bigMemberId,
        chapter_id: bigChapterId,
        tenant_id: actor.tenantId,
        left_at: null,
      },
      data: { left_at: new Date() },
    });

    if (count === 0) throw new NotFoundException('Membro não encontrado neste diretório');

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'REMOVE_CHAPTER_MEMBER',
      entityId: bigChapterId,
      metadata: { member_id: memberId },
    });

    return { data: null, message: 'Membro removido do diretório' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ÓRGÃOS PARTIDÁRIOS
  // ═══════════════════════════════════════════════════════════════════════════

  async createOrgan(dto: CreateOrganDto, actor: JwtPayload) {
    const organ = await this.prisma.party_organs.create({
      data: {
        tenant_id: actor.tenantId,
        name: dto.name,
        description: dto.description ?? null,
        created_by: actor.userId,
      },
      select: ORGAN_SAFE_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'CREATE_ORGAN',
      entityId: organ.id,
      metadata: { name: dto.name },
    });

    return { data: serializeBigInt(organ), message: 'Órgão partidário criado com sucesso' };
  }

  async findAllOrgans(actor: JwtPayload) {
    const organs = await this.prisma.party_organs.findMany({
      where: { tenant_id: actor.tenantId, deleted_at: null },
      select: ORGAN_SAFE_SELECT,
      orderBy: { name: 'asc' },
    });

    return { data: serializeBigInt(organs), message: '' };
  }

  async findOneOrgan(id: bigint, tenantId: number) {
    const organ = await this.prisma.party_organs.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: {
        ...ORGAN_SAFE_SELECT,
        members: {
          where: { left_at: null },
          select: ORGAN_MEMBER_SELECT,
        },
      },
    });

    if (!organ) throw new NotFoundException('Órgão não encontrado');
    return { data: serializeBigInt(organ), message: '' };
  }

  async updateOrgan(id: string, dto: UpdateOrganDto, actor: JwtPayload) {
    const bigId = BigInt(id);

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;

    const { count } = await this.prisma.party_organs.updateMany({
      where: { id: bigId, tenant_id: actor.tenantId, deleted_at: null },
      data: updateData,
    });

    if (count === 0) throw new NotFoundException('Órgão não encontrado ou já excluído');

    const updated = await this.prisma.party_organs.findFirst({
      where: { id: bigId },
      select: ORGAN_SAFE_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'UPDATE_ORGAN',
      entityId: bigId,
      metadata: { fields: Object.keys(dto) },
    });

    return { data: serializeBigInt(updated), message: 'Órgão atualizado com sucesso' };
  }

  async removeOrgan(id: string, actor: JwtPayload) {
    const bigId = BigInt(id);

    const { count } = await this.prisma.party_organs.updateMany({
      where: { id: bigId, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });

    if (count === 0) throw new NotFoundException('Órgão não encontrado ou já excluído');

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'DELETE_ORGAN',
      entityId: bigId,
      metadata: {},
    });

    return { data: null, message: 'Órgão removido com sucesso' };
  }

  // ─── Membros de órgão ─────────────────────────────────────────────────────

  async addOrganMember(organId: string, dto: AddOrganMemberDto, actor: JwtPayload) {
    const bigOrganId = BigInt(organId);
    const bigPersonId = BigInt(dto.person_id);

    const organ = await this.prisma.party_organs.findFirst({
      where: { id: bigOrganId, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!organ) throw new NotFoundException('Órgão não encontrado');

    // Impede duplicata ativa
    const existing = await this.prisma.organ_members.findFirst({
      where: {
        organ_id: bigOrganId,
        person_id: bigPersonId,
        tenant_id: actor.tenantId,
        left_at: null,
      },
    });
    if (existing) throw new ConflictException('Pessoa já é membro ativo deste órgão');

    const member = await this.prisma.organ_members.create({
      data: {
        organ_id: bigOrganId,
        person_id: bigPersonId,
        tenant_id: actor.tenantId,
        role: dto.role ?? null,
        joined_at: new Date(dto.joined_at),
      },
      select: ORGAN_MEMBER_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'ADD_ORGAN_MEMBER',
      entityId: bigOrganId,
      metadata: { person_id: dto.person_id, role: dto.role },
    });

    return { data: serializeBigInt(member), message: 'Membro adicionado ao órgão' };
  }

  async listOrganMembers(organId: string, actor: JwtPayload) {
    const bigOrganId = BigInt(organId);

    const organ = await this.prisma.party_organs.findFirst({
      where: { id: bigOrganId, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!organ) throw new NotFoundException('Órgão não encontrado');

    const members = await this.prisma.organ_members.findMany({
      where: { organ_id: bigOrganId, tenant_id: actor.tenantId, left_at: null },
      select: ORGAN_MEMBER_SELECT,
      orderBy: { joined_at: 'asc' },
    });

    return { data: serializeBigInt(members), message: '' };
  }

  async removeOrganMember(organId: string, memberId: string, actor: JwtPayload) {
    const bigOrganId = BigInt(organId);
    const bigMemberId = BigInt(memberId);

    const { count } = await this.prisma.organ_members.updateMany({
      where: {
        id: bigMemberId,
        organ_id: bigOrganId,
        tenant_id: actor.tenantId,
        left_at: null,
      },
      data: { left_at: new Date() },
    });

    if (count === 0) throw new NotFoundException('Membro não encontrado neste órgão');

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'REMOVE_ORGAN_MEMBER',
      entityId: bigOrganId,
      metadata: { member_id: memberId },
    });

    return { data: null, message: 'Membro removido do órgão' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT INTERNO
  // ═══════════════════════════════════════════════════════════════════════════

  private async audit(params: {
    tenantId: number;
    userId: number;
    action: string;
    entityId: bigint;
    metadata?: object;
  }): Promise<void> {
    await this.prisma.audit_logs.create({
      data: {
        tenant_id: params.tenantId,
        user_id: params.userId,
        action: params.action,
        entity: 'party',
        entity_id: params.entityId,
        metadata: params.metadata ?? {},
      },
    });
  }
}

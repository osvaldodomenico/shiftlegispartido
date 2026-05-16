import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { AttachTagsDto } from './dto/attach-tags.dto';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

const TAG_SAFE_SELECT = {
  id: true,
  tenant_id: true,
  name: true,
  color: true,
  created_at: true,
};

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTagDto, actor: JwtPayload) {
    const tid = BigInt(actor.tenantId);
    const uid = BigInt(actor.userId);

    const existing = await this.prisma.tags.findFirst({
      where: { tenant_id: tid, name: dto.name, deleted_at: null },
    });
    if (existing) throw new ConflictException('Tag com esse nome já existe');

    const tag = await this.prisma.tags.create({
      data: {
        tenant_id: tid,
        created_by: uid,
        name: dto.name,
        color: dto.color ?? '#6366f1',
      },
      select: TAG_SAFE_SELECT,
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tid,
        user_id: uid,
        action: 'CREATE',
        entity: 'tags',
        entity_id: tag.id,
        metadata: { data: JSON.stringify(dto) },
      },
    });

    return { success: true, data: { ...tag, id: tag.id.toString(), tenant_id: tag.id.toString() }, message: 'Tag criada com sucesso' };
  }

  async findAll(tenantId: number) {
    const tid = BigInt(tenantId);
    const tags = await this.prisma.tags.findMany({
      where: { tenant_id: tid, deleted_at: null },
      select: TAG_SAFE_SELECT,
      orderBy: { name: 'asc' },
    });
    return { success: true, data: tags.map((t) => ({ ...t, id: t.id.toString(), tenant_id: t.tenant_id.toString() })) };
  }

  async update(id: string, dto: UpdateTagDto, actor: JwtPayload) {
    const tid = BigInt(actor.tenantId);
    const uid = BigInt(actor.userId);
    const tagId = BigInt(id);

    if (dto.name) {
      const conflict = await this.prisma.tags.findFirst({
        where: {
          tenant_id: tid,
          name: dto.name,
          deleted_at: null,
          NOT: { id: tagId },
        },
      });
      if (conflict) throw new ConflictException('Tag com esse nome já existe');
    }

    const count = await this.prisma.tags.updateMany({
      where: { id: tagId, tenant_id: tid, deleted_at: null },
      data: { ...(dto.name && { name: dto.name }), ...(dto.color && { color: dto.color }) },
    });
    if (count.count === 0) throw new NotFoundException('Tag não encontrada');

    const updated = await this.prisma.tags.findUnique({ where: { id: tagId }, select: TAG_SAFE_SELECT });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tid,
        user_id: uid,
        action: 'UPDATE',
        entity: 'tags',
        entity_id: tagId,
        metadata: { data: JSON.stringify(dto) },
      },
    });

    return { success: true, data: updated ? { ...updated, id: updated.id.toString(), tenant_id: updated.tenant_id.toString() } : null, message: 'Tag atualizada' };
  }

  async remove(id: string, actor: JwtPayload) {
    const tid = BigInt(actor.tenantId);
    const uid = BigInt(actor.userId);
    const tagId = BigInt(id);

    const count = await this.prisma.tags.updateMany({
      where: { id: tagId, tenant_id: tid, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    if (count.count === 0) throw new NotFoundException('Tag não encontrada');

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tid,
        user_id: uid,
        action: 'DELETE',
        entity: 'tags',
        entity_id: tagId,
        metadata: null,
      },
    });

    return { success: true, message: 'Tag removida' };
  }

  async attachTags(peopleId: string, dto: AttachTagsDto, actor: JwtPayload) {
    const tid = BigInt(actor.tenantId);
    const uid = BigInt(actor.userId);
    const personId = BigInt(peopleId);

    // Valida que todas as tags pertencem ao tenant
    const tags = await this.prisma.tags.findMany({
      where: { id: { in: dto.tag_ids.map((id) => BigInt(id)) }, tenant_id: tid, deleted_at: null },
      select: { id: true },
    });
    if (tags.length !== dto.tag_ids.length) {
      throw new NotFoundException('Uma ou mais tags não encontradas');
    }

    // Upsert para evitar duplicatas — people_tags usa (person_id, tag_id) como PK composta
    await Promise.all(
      dto.tag_ids.map((tagId) =>
        this.prisma.people_tags.upsert({
          where: { person_id_tag_id: { person_id: personId, tag_id: BigInt(tagId) } },
          create: { tenant_id: tid, person_id: personId, tag_id: BigInt(tagId) },
          update: {},
        }),
      ),
    );

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tid,
        user_id: uid,
        action: 'CREATE',
        entity: 'people_tags',
        entity_id: personId,
        metadata: { data: JSON.stringify(dto) },
      },
    });

    return { success: true, message: 'Tags vinculadas' };
  }

  async detachTag(peopleId: string, tagId: string, actor: JwtPayload) {
    const tid = BigInt(actor.tenantId);
    const uid = BigInt(actor.userId);
    const personId = BigInt(peopleId);
    const tId = BigInt(tagId);

    const link = await this.prisma.people_tags.findFirst({
      where: { person_id: personId, tag_id: tId, tenant_id: tid },
    });
    if (!link) throw new NotFoundException('Vínculo não encontrado');

    // Delete por PK composta (person_id, tag_id)
    await this.prisma.people_tags.delete({
      where: { person_id_tag_id: { person_id: personId, tag_id: tId } },
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tid,
        user_id: uid,
        action: 'DELETE',
        entity: 'people_tags',
        entity_id: personId,
        metadata: null,
      },
    });

    return { success: true, message: 'Tag desvinculada' };
  }
}

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
  updated_at: true,
};

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTagDto, actor: JwtPayload) {
    const existing = await this.prisma.tags.findFirst({
      where: { tenant_id: actor.tenantId, name: dto.name, deleted_at: null },
    });
    if (existing) throw new ConflictException('Tag com esse nome já existe');

    const tag = await this.prisma.tags.create({
      data: {
        tenant_id: actor.tenantId,
        name: dto.name,
        color: dto.color ?? '#6366f1',
      },
      select: TAG_SAFE_SELECT,
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId,
        user_id: actor.userId,
        action: 'CREATE',
        entity: 'tags',
        entity_id: tag.id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: tag, message: 'Tag criada com sucesso' };
  }

  async findAll(tenantId: string) {
    const tags = await this.prisma.tags.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      select: TAG_SAFE_SELECT,
      orderBy: { name: 'asc' },
    });
    return { success: true, data: tags };
  }

  async update(id: string, dto: UpdateTagDto, actor: JwtPayload) {
    // Verifica duplicata de nome (exceto a própria tag)
    if (dto.name) {
      const conflict = await this.prisma.tags.findFirst({
        where: {
          tenant_id: actor.tenantId,
          name: dto.name,
          deleted_at: null,
          NOT: { id },
        },
      });
      if (conflict) throw new ConflictException('Tag com esse nome já existe');
    }

    const count = await this.prisma.tags.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { ...dto },
    });
    if (count.count === 0) throw new NotFoundException('Tag não encontrada');

    const updated = await this.prisma.tags.findUnique({ where: { id }, select: TAG_SAFE_SELECT });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId,
        user_id: actor.userId,
        action: 'UPDATE',
        entity: 'tags',
        entity_id: id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: updated, message: 'Tag atualizada' };
  }

  async remove(id: string, actor: JwtPayload) {
    const count = await this.prisma.tags.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    if (count.count === 0) throw new NotFoundException('Tag não encontrada');

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId,
        user_id: actor.userId,
        action: 'DELETE',
        entity: 'tags',
        entity_id: id,
        payload: null,
      },
    });

    return { success: true, message: 'Tag removida' };
  }

  async attachTags(peopleId: string, dto: AttachTagsDto, actor: JwtPayload) {
    // Valida que todas as tags pertencem ao tenant
    const tags = await this.prisma.tags.findMany({
      where: { id: { in: dto.tag_ids }, tenant_id: actor.tenantId, deleted_at: null },
      select: { id: true },
    });
    if (tags.length !== dto.tag_ids.length) {
      throw new NotFoundException('Uma ou mais tags não encontradas');
    }

    // Upsert para evitar duplicatas
    await Promise.all(
      dto.tag_ids.map((tagId) =>
        this.prisma.people_tags.upsert({
          where: { people_id_tag_id: { people_id: peopleId, tag_id: tagId } },
          create: { tenant_id: actor.tenantId, people_id: peopleId, tag_id: tagId },
          update: {},
        }),
      ),
    );

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId,
        user_id: actor.userId,
        action: 'CREATE',
        entity: 'people_tags',
        entity_id: peopleId,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, message: 'Tags vinculadas' };
  }

  async detachTag(peopleId: string, tagId: string, actor: JwtPayload) {
    const link = await this.prisma.people_tags.findFirst({
      where: { people_id: peopleId, tag_id: tagId, tenant_id: actor.tenantId },
    });
    if (!link) throw new NotFoundException('Vínculo não encontrado');

    await this.prisma.people_tags.delete({ where: { id: link.id } });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId,
        user_id: actor.userId,
        action: 'DELETE',
        entity: 'people_tags',
        entity_id: link.id,
        payload: null,
      },
    });

    return { success: true, message: 'Tag desvinculada' };
  }
}

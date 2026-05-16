import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import {
  validateCpf,
  hashCpf,
  cpfHashEquals,
  encryptCpf,
  decryptCpf,
  maskCpf,
  sanitizeCpfForSearch,
} from '../../common/utils/cpf.util';

/**
 * Campos retornados em todas as queries.
 * cpf_hash e cpf_encrypted NUNCA são incluídos no select público.
 */
const PERSON_SAFE_SELECT = {
  id: true,
  tenant_id: true,
  user_id: true,
  name: true,
  email: true,
  phone: true,
  type: true,
  status: true,
  birthdate: true,
  address: true,
  city: true,
  state: true,
  zip_code: true,
  notes: true,
  created_at: true,
  updated_at: true,
  // cpf_hash, cpf_encrypted e cpf_key_version excluídos do select público
} as const;

// Select interno usado apenas quando precisamos descriptografar para mascarar
const PERSON_DECRYPT_SELECT = {
  ...PERSON_SAFE_SELECT,
  cpf_encrypted: true,
  cpf_key_version: true,
} as const;

@Injectable()
export class PeopleService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────────

  async create(dto: CreatePersonDto, actor: JwtPayload) {
    this.assertCpfValid(dto.cpf);

    const cpfHash = hashCpf(dto.cpf);
    // IV aleatório gerado por encryptCpf — nunca reutilizado
    const { encrypted: cpfEncrypted, keyVersion } = encryptCpf(dto.cpf);

    await this.assertCpfUnique(cpfHash, actor.tenantId);

    const person = await this.prisma.people.create({
      data: {
        tenant_id: actor.tenantId,
        user_id: dto.userId ?? null,
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        cpf_hash: cpfHash,
        cpf_encrypted: cpfEncrypted,
        cpf_key_version: keyVersion,
        type: dto.type as any,
        status: dto.status ?? 'active',
        birthdate: dto.birthdate ? new Date(dto.birthdate) : null,
        address: dto.address ?? null,
        city: dto.city ?? null,
        state: dto.state ?? null,
        zip_code: dto.zipCode ?? null,
        notes: dto.notes ?? null,
      },
      select: PERSON_DECRYPT_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'CREATE_PERSON',
      entityId: Number(person.id),
      metadata: { name: person.name },
    });

    return {
      data: this.format(person),
      message: 'Pessoa cadastrada com sucesso',
    };
  }

  async findAll(
    tenantId: number,
    page = 1,
    limit = 10,
    name?: string,
    cpf?: string,
    status?: string,
    type?: string,
  ) {
    // Busca por CPF: sanitiza para 11 dígitos exatos antes de gerar hash.
    // Busca parcial é bloqueada: sanitizeCpfForSearch retorna null se input != 11 dígitos.
    // O hash garante que o valor do CPF nunca trafega na query.
    const cpfHash = cpf
      ? (() => {
          const sanitized = sanitizeCpfForSearch(cpf);
          return sanitized ? hashCpf(sanitized) : undefined;
        })()
      : undefined;

    const where: any = {
      tenant_id: tenantId,
      deleted_at: null,
      ...(name && { name: { contains: name } }),
      ...(cpfHash && { cpf_hash: cpfHash }),
      ...(status && { status }),
      ...(type && { type }),
    };

    const [items, total] = await Promise.all([
      this.prisma.people.findMany({
        where,
        select: PERSON_DECRYPT_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.people.count({ where }),
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
    const person = await this.prisma.people.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: PERSON_DECRYPT_SELECT,
    });

    if (!person) throw new NotFoundException('Pessoa não encontrada');

    return { data: this.format(person), message: '' };
  }

  async update(id: number, dto: UpdatePersonDto, actor: JwtPayload) {
    const existing = await this.prisma.people.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Pessoa não encontrada');

    const updateData: Record<string, any> = {};

    // CPF: revalidar, rehash e recriptografar se fornecido
    if (dto.cpf !== undefined) {
      this.assertCpfValid(dto.cpf);
      const cpfHash = hashCpf(dto.cpf);

      // Comparação via timingSafeEqual — evita timing attack na comparação de hashes
      const cpfUnchanged = existing.cpf_hash
        ? cpfHashEquals(cpfHash, existing.cpf_hash)
        : false;

      if (!cpfUnchanged) {
        await this.assertCpfUnique(cpfHash, actor.tenantId, id);
        const { encrypted: cpfEncrypted, keyVersion } = encryptCpf(dto.cpf);
        updateData.cpf_hash = cpfHash;
        updateData.cpf_encrypted = cpfEncrypted;
        updateData.cpf_key_version = keyVersion;
      }
    }

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.userId !== undefined) updateData.user_id = dto.userId;
    if (dto.birthdate !== undefined) updateData.birthdate = new Date(dto.birthdate);
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.zipCode !== undefined) updateData.zip_code = dto.zipCode;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    // updateMany garante atomicidade: não afeta registros deletados/cross-tenant
    const { count } = await this.prisma.people.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: updateData,
    });

    if (count === 0) throw new NotFoundException('Pessoa não encontrada ou já excluída');

    const person = await this.prisma.people.findFirst({
      where: { id, tenant_id: actor.tenantId },
      select: PERSON_DECRYPT_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'UPDATE_PERSON',
      entityId: id,
      metadata: { fields: Object.keys(dto) },
    });

    return { data: this.format(person!), message: 'Pessoa atualizada com sucesso' };
  }

  async remove(id: number, actor: JwtPayload) {
    const existing = await this.prisma.people.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Pessoa não encontrada');

    const { count } = await this.prisma.people.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });

    if (count === 0) throw new NotFoundException('Pessoa não encontrada ou já excluída');

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'DELETE_PERSON',
      entityId: id,
      metadata: { name: existing.name },
    });

    return { data: null, message: 'Pessoa removida com sucesso' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Formata o registro para response:
   * - Descriptografa o CPF apenas para aplicar a máscara
   * - Nunca retorna o valor completo
   */
  private format(person: any) {
    // decryptCpf lê a versão da chave do próprio payload — resiliente a rotação
    // O resultado é imediatamente mascarado e nunca exposto em logs ou response
    const cpfMasked = person.cpf_encrypted
      ? maskCpf(decryptCpf(person.cpf_encrypted))
      : null;

    return {
      id: Number(person.id),
      tenantId: Number(person.tenant_id),
      userId: person.user_id ? Number(person.user_id) : null,
      name: person.name,
      email: person.email,
      phone: person.phone,
      cpf: cpfMasked,             // ***.456.***-** — nunca o valor completo
      type: person.type,
      status: person.status,
      birthdate: person.birthdate,
      address: person.address,
      city: person.city,
      state: person.state,
      zipCode: person.zip_code,
      notes: person.notes,
      createdAt: person.created_at,
      updatedAt: person.updated_at,
    };
  }

  private assertCpfValid(cpf: string): void {
    if (!validateCpf(cpf)) {
      throw new BadRequestException('CPF inválido');
    }
  }

  private async assertCpfUnique(
    cpfHash: string,
    tenantId: number,
    excludeId?: number,
  ): Promise<void> {
    const existing = await this.prisma.people.findFirst({
      where: {
        cpf_hash: cpfHash,
        tenant_id: tenantId,
        deleted_at: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('CPF já cadastrado neste tenant');
    }
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
        entity: 'people',
        entity_id: params.entityId,
        metadata: params.metadata ?? {},
      },
    });
  }
}

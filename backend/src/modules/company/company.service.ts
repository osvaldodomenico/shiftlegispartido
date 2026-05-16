import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { UpdateCompanyDto } from './dto/update-company.dto';

const TENANT_SELECT = {
  id: true,
  name: true,
  cnpj: true,
  email: true,
  phone: true,
  website: true,
  country: true,
  city: true,
  state: true,
  zip_code: true,
  street: true,
  number: true,
  district: true,
  complement: true,
} as const;

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(actor: JwtPayload) {
    const tenant = await this.prisma.tenants.findFirst({
      where: { id: actor.tenantId, deleted_at: null },
      select: TENANT_SELECT,
    });
    if (!tenant) throw new NotFoundException('Empresa não encontrada');

    return { data: this.format(tenant), message: '' };
  }

  async updateCurrent(dto: UpdateCompanyDto, actor: JwtPayload) {
    const { count } = await this.prisma.tenants.updateMany({
      where: { id: actor.tenantId, deleted_at: null },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.zip_code !== undefined && { zip_code: dto.zip_code }),
        ...(dto.street !== undefined && { street: dto.street }),
        ...(dto.number !== undefined && { number: dto.number }),
        ...(dto.district !== undefined && { district: dto.district }),
        ...(dto.complement !== undefined && { complement: dto.complement }),
      },
    });
    if (count === 0) throw new NotFoundException('Empresa não encontrada');

    const updated = await this.prisma.tenants.findFirst({
      where: { id: actor.tenantId, deleted_at: null },
      select: TENANT_SELECT,
    });
    if (!updated) throw new NotFoundException('Empresa não encontrada');

    return { data: this.format(updated), message: 'Dados da empresa salvos com sucesso.' };
  }

  private format(t: any) {
    return {
      id: Number(t.id),
      name: t.name,
      cnpj: t.cnpj,
      email: t.email,
      phone: t.phone,
      website: t.website,
      country: t.country,
      city: t.city,
      state: t.state,
      zip_code: t.zip_code,
      street: t.street,
      number: t.number,
      district: t.district,
      complement: t.complement,
    };
  }
}


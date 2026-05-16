import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { CreateContractPaymentDto } from './dto/create-contract-payment.dto';
import { CreateScheduleEventDto } from './dto/create-schedule-event.dto';
import { UpdateScheduleEventDto } from './dto/update-schedule-event.dto';
import { CreateTseReportDto } from './dto/create-tse-report.dto';
import { UpdateTseReportDto } from './dto/update-tse-report.dto';
import { CreateTseReportItemDto } from './dto/create-tse-report-item.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── AUDIT ─────────────────────────────────────────────────────────────────

  private async audit(
    tenantId: bigint,
    userId: bigint,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: string,
    entityId: bigint,
    payload: object,
  ) {
    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        action,
        entity,
        entity_id: entityId,
        payload: JSON.stringify(payload),
      },
    });
  }

  // ── CAMPAIGNS CRUD ────────────────────────────────────────────────────────

  async create(dto: CreateCampaignDto, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    const campaign = await this.prisma.campaigns.create({
      data: {
        tenant_id: tenantId,
        election_id: BigInt(dto.election_id),
        person_id: BigInt(dto.people_id),
        name: dto.name,
        office: dto.office,
        budget: dto.budget ?? null,
        status: 'planejamento',
        created_by: userId,
      },
    });

    await this.audit(tenantId, userId, 'CREATE', 'campaigns', campaign.id, dto);
    return { data: campaign, message: 'Campanha criada com sucesso' };
  }

  async findAll(actor: JwtPayload, electionId?: string) {
    const tenantId = BigInt(actor.tenantId);

    const where: any = { tenant_id: tenantId, deleted_at: null };
    if (electionId) {
      where.election_id = BigInt(electionId);
    }

    const campaigns = await this.prisma.campaigns.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return { data: campaigns, message: 'Campanhas listadas com sucesso' };
  }

  async findOne(id: string, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);

    const campaign = await this.prisma.campaigns.findFirst({
      where: { id: BigInt(id), tenant_id: tenantId, deleted_at: null },
    });

    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    return { data: campaign, message: 'Campanha encontrada' };
  }

  async update(id: string, dto: UpdateCampaignDto, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    const updateData: any = { ...dto, updated_at: new Date() };
    if (dto.election_id) updateData.election_id = BigInt(dto.election_id);
    if (dto.people_id) updateData.person_id = BigInt(dto.people_id);
    delete updateData.election_id;
    delete updateData.people_id;
    if (dto.election_id) updateData.election_id = BigInt(dto.election_id);
    if (dto.people_id) updateData.person_id = BigInt(dto.people_id);

    // Limpar campos que foram convertidos
    const cleanData: any = { updated_at: new Date() };
    if (dto.name !== undefined) cleanData.name = dto.name;
    if (dto.office !== undefined) cleanData.office = dto.office;
    if (dto.budget !== undefined) cleanData.budget = dto.budget;
    if (dto.status !== undefined) cleanData.status = dto.status;
    if (dto.election_id !== undefined) cleanData.election_id = BigInt(dto.election_id);
    if (dto.people_id !== undefined) cleanData.person_id = BigInt(dto.people_id);

    const result = await this.prisma.campaigns.updateMany({
      where: { id: BigInt(id), tenant_id: tenantId, deleted_at: null },
      data: cleanData,
    });

    if (result.count === 0) throw new NotFoundException('Campanha não encontrada');

    const campaign = await this.prisma.campaigns.findFirst({
      where: { id: BigInt(id), tenant_id: tenantId },
    });

    await this.audit(tenantId, userId, 'UPDATE', 'campaigns', BigInt(id), dto);
    return { data: campaign, message: 'Campanha atualizada com sucesso' };
  }

  async remove(id: string, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    const result = await this.prisma.campaigns.updateMany({
      where: { id: BigInt(id), tenant_id: tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });

    if (result.count === 0) throw new NotFoundException('Campanha não encontrada');

    await this.audit(tenantId, userId, 'DELETE', 'campaigns', BigInt(id), { id });
    return { data: null, message: 'Campanha removida com sucesso' };
  }

  // ── TEAM ──────────────────────────────────────────────────────────────────

  private async assertCampaignBelongsToTenant(id: string, tenantId: bigint) {
    const campaign = await this.prisma.campaigns.findFirst({
      where: { id: BigInt(id), tenant_id: tenantId, deleted_at: null },
    });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    return campaign;
  }

  async addTeamMember(campaignId: string, dto: CreateTeamMemberDto, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    await this.assertCampaignBelongsToTenant(campaignId, tenantId);

    // Verifica duplicata
    const existing = await this.prisma.campaign_team.findFirst({
      where: {
        campaign_id: BigInt(campaignId),
        person_id: BigInt(dto.people_id),
        deleted_at: null,
      },
    });
    if (existing) throw new ConflictException('Membro já pertence à equipe');

    const member = await this.prisma.campaign_team.create({
      data: {
        tenant_id: tenantId,
        campaign_id: BigInt(campaignId),
        person_id: BigInt(dto.people_id),
        role: dto.role as any,
        payment_type: (dto.payment_type ?? 'voluntario') as any,
        salary: dto.salary ?? null,
        start_date: new Date(dto.start_date),
        end_date: dto.end_date ? new Date(dto.end_date) : null,
        notes: dto.notes ?? null,
        created_by: userId,
      },
    });

    await this.audit(tenantId, userId, 'CREATE', 'campaign_team', member.id, dto);
    return { data: member, message: 'Membro adicionado à equipe' };
  }

  async listTeam(campaignId: string, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    await this.assertCampaignBelongsToTenant(campaignId, tenantId);

    const members = await this.prisma.campaign_team.findMany({
      where: { campaign_id: BigInt(campaignId), tenant_id: tenantId, deleted_at: null },
      orderBy: { created_at: 'desc' },
    });

    return { data: members, message: 'Equipe listada' };
  }

  async updateTeamMember(
    campaignId: string,
    memberId: string,
    dto: UpdateTeamMemberDto,
    actor: JwtPayload,
  ) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    const cleanData: any = { updated_at: new Date() };
    if (dto.role !== undefined) cleanData.role = dto.role;
    if (dto.payment_type !== undefined) cleanData.payment_type = dto.payment_type;
    if (dto.salary !== undefined) cleanData.salary = dto.salary;
    if (dto.start_date !== undefined) cleanData.start_date = new Date(dto.start_date);
    if (dto.end_date !== undefined) cleanData.end_date = new Date(dto.end_date);
    if (dto.notes !== undefined) cleanData.notes = dto.notes;

    const result = await this.prisma.campaign_team.updateMany({
      where: {
        id: BigInt(memberId),
        campaign_id: BigInt(campaignId),
        tenant_id: tenantId,
        deleted_at: null,
      },
      data: cleanData,
    });

    if (result.count === 0) throw new NotFoundException('Membro não encontrado');

    const member = await this.prisma.campaign_team.findFirst({
      where: { id: BigInt(memberId) },
    });

    await this.audit(tenantId, userId, 'UPDATE', 'campaign_team', BigInt(memberId), dto);
    return { data: member, message: 'Membro atualizado' };
  }

  async removeTeamMember(campaignId: string, memberId: string, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    const result = await this.prisma.campaign_team.updateMany({
      where: {
        id: BigInt(memberId),
        campaign_id: BigInt(campaignId),
        tenant_id: tenantId,
        deleted_at: null,
      },
      data: { deleted_at: new Date() },
    });

    if (result.count === 0) throw new NotFoundException('Membro não encontrado');

    await this.audit(tenantId, userId, 'DELETE', 'campaign_team', BigInt(memberId), { memberId });
    return { data: null, message: 'Membro removido da equipe' };
  }

  // ── CONTRACTS ─────────────────────────────────────────────────────────────

  async addContract(campaignId: string, dto: CreateContractDto, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    await this.assertCampaignBelongsToTenant(campaignId, tenantId);

    const contract = await this.prisma.campaign_contracts.create({
      data: {
        tenant_id: tenantId,
        campaign_id: BigInt(campaignId),
        person_id: BigInt(dto.people_id),
        description: dto.description,
        object: dto.object,
        value: dto.value,
        status: (dto.status ?? 'draft') as any,
        start_date: dto.start_date ? new Date(dto.start_date) : null,
        end_date: dto.end_date ? new Date(dto.end_date) : null,
        tse_code: dto.tse_code ?? null,
        created_by: userId,
      },
    });

    await this.audit(tenantId, userId, 'CREATE', 'campaign_contracts', contract.id, dto);
    return { data: contract, message: 'Contrato criado com sucesso' };
  }

  async listContracts(campaignId: string, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    await this.assertCampaignBelongsToTenant(campaignId, tenantId);

    const contracts = await this.prisma.campaign_contracts.findMany({
      where: { campaign_id: BigInt(campaignId), tenant_id: tenantId, deleted_at: null },
      include: { payments: true },
      orderBy: { created_at: 'desc' },
    });

    return { data: contracts, message: 'Contratos listados' };
  }

  async updateContract(
    campaignId: string,
    contractId: string,
    dto: UpdateContractDto,
    actor: JwtPayload,
  ) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    const cleanData: any = { updated_at: new Date() };
    if (dto.description !== undefined) cleanData.description = dto.description;
    if (dto.object !== undefined) cleanData.object = dto.object;
    if (dto.value !== undefined) cleanData.value = dto.value;
    if (dto.status !== undefined) cleanData.status = dto.status;
    if (dto.start_date !== undefined) cleanData.start_date = new Date(dto.start_date);
    if (dto.end_date !== undefined) cleanData.end_date = new Date(dto.end_date);
    if (dto.tse_code !== undefined) cleanData.tse_code = dto.tse_code;
    if (dto.people_id !== undefined) cleanData.person_id = BigInt(dto.people_id);

    const result = await this.prisma.campaign_contracts.updateMany({
      where: {
        id: BigInt(contractId),
        campaign_id: BigInt(campaignId),
        tenant_id: tenantId,
        deleted_at: null,
      },
      data: cleanData,
    });

    if (result.count === 0) throw new NotFoundException('Contrato não encontrado');

    const contract = await this.prisma.campaign_contracts.findFirst({
      where: { id: BigInt(contractId) },
      include: { payments: true },
    });

    await this.audit(tenantId, userId, 'UPDATE', 'campaign_contracts', BigInt(contractId), dto);
    return { data: contract, message: 'Contrato atualizado' };
  }

  async removeContract(campaignId: string, contractId: string, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    const result = await this.prisma.campaign_contracts.updateMany({
      where: {
        id: BigInt(contractId),
        campaign_id: BigInt(campaignId),
        tenant_id: tenantId,
        deleted_at: null,
      },
      data: { deleted_at: new Date() },
    });

    if (result.count === 0) throw new NotFoundException('Contrato não encontrado');

    await this.audit(tenantId, userId, 'DELETE', 'campaign_contracts', BigInt(contractId), { contractId });
    return { data: null, message: 'Contrato removido' };
  }

  async addContractPayment(
    campaignId: string,
    contractId: string,
    dto: CreateContractPaymentDto,
    actor: JwtPayload,
  ) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    // Verifica que o contrato pertence à campanha/tenant
    const contract = await this.prisma.campaign_contracts.findFirst({
      where: {
        id: BigInt(contractId),
        campaign_id: BigInt(campaignId),
        tenant_id: tenantId,
        deleted_at: null,
      },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');

    const payment = await this.prisma.campaign_contract_payments.create({
      data: {
        tenant_id: tenantId,
        contract_id: BigInt(contractId),
        amount: dto.amount,
        due_date: new Date(dto.due_date),
        paid_at: dto.paid_at ? new Date(dto.paid_at) : null,
        notes: dto.notes ?? null,
      },
    });

    await this.audit(tenantId, userId, 'CREATE', 'campaign_contract_payments', payment.id, dto);
    return { data: payment, message: 'Pagamento registrado' };
  }

  // ── SCHEDULE ──────────────────────────────────────────────────────────────

  async createScheduleEvent(campaignId: string, dto: CreateScheduleEventDto, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    await this.assertCampaignBelongsToTenant(campaignId, tenantId);

    const event = await this.prisma.campaign_schedule.create({
      data: {
        tenant_id: tenantId,
        campaign_id: BigInt(campaignId),
        title: dto.title,
        type: dto.type as any,
        status: (dto.status ?? 'planned') as any,
        location: dto.location ?? null,
        start_at: new Date(dto.start_at),
        end_at: dto.end_at ? new Date(dto.end_at) : null,
        notes: dto.notes ?? null,
        created_by: userId,
      },
    });

    await this.audit(tenantId, userId, 'CREATE', 'campaign_schedule', event.id, dto);
    return { data: event, message: 'Evento criado na agenda' };
  }

  async listSchedule(campaignId: string, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    await this.assertCampaignBelongsToTenant(campaignId, tenantId);

    const events = await this.prisma.campaign_schedule.findMany({
      where: { campaign_id: BigInt(campaignId), tenant_id: tenantId, deleted_at: null },
      orderBy: { start_at: 'asc' },
    });

    return { data: events, message: 'Agenda listada' };
  }

  async updateScheduleEvent(
    campaignId: string,
    eventId: string,
    dto: UpdateScheduleEventDto,
    actor: JwtPayload,
  ) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    const cleanData: any = { updated_at: new Date() };
    if (dto.title !== undefined) cleanData.title = dto.title;
    if (dto.type !== undefined) cleanData.type = dto.type;
    if (dto.status !== undefined) cleanData.status = dto.status;
    if (dto.location !== undefined) cleanData.location = dto.location;
    if (dto.start_at !== undefined) cleanData.start_at = new Date(dto.start_at);
    if (dto.end_at !== undefined) cleanData.end_at = new Date(dto.end_at);
    if (dto.notes !== undefined) cleanData.notes = dto.notes;

    const result = await this.prisma.campaign_schedule.updateMany({
      where: {
        id: BigInt(eventId),
        campaign_id: BigInt(campaignId),
        tenant_id: tenantId,
        deleted_at: null,
      },
      data: cleanData,
    });

    if (result.count === 0) throw new NotFoundException('Evento não encontrado');

    const event = await this.prisma.campaign_schedule.findFirst({
      where: { id: BigInt(eventId) },
    });

    await this.audit(tenantId, userId, 'UPDATE', 'campaign_schedule', BigInt(eventId), dto);
    return { data: event, message: 'Evento atualizado' };
  }

  async removeScheduleEvent(campaignId: string, eventId: string, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    const result = await this.prisma.campaign_schedule.updateMany({
      where: {
        id: BigInt(eventId),
        campaign_id: BigInt(campaignId),
        tenant_id: tenantId,
        deleted_at: null,
      },
      data: { deleted_at: new Date() },
    });

    if (result.count === 0) throw new NotFoundException('Evento não encontrado');

    await this.audit(tenantId, userId, 'DELETE', 'campaign_schedule', BigInt(eventId), { eventId });
    return { data: null, message: 'Evento removido da agenda' };
  }

  // ── TSE REPORTS ───────────────────────────────────────────────────────────

  async createTseReport(campaignId: string, dto: CreateTseReportDto, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    await this.assertCampaignBelongsToTenant(campaignId, tenantId);

    const report = await this.prisma.tse_reports.create({
      data: {
        tenant_id: tenantId,
        campaign_id: BigInt(campaignId),
        type: dto.type as any,
        status: 'draft',
        reference: dto.reference,
        period_start: new Date(dto.period_start),
        period_end: new Date(dto.period_end),
        notes: dto.notes ?? null,
        created_by: userId,
      },
    });

    await this.audit(tenantId, userId, 'CREATE', 'tse_reports', report.id, dto);
    return { data: report, message: 'Relatório TSE criado' };
  }

  async listTseReports(campaignId: string, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    await this.assertCampaignBelongsToTenant(campaignId, tenantId);

    const reports = await this.prisma.tse_reports.findMany({
      where: { campaign_id: BigInt(campaignId), tenant_id: tenantId },
      include: { items: true },
      orderBy: { created_at: 'desc' },
    });

    return { data: reports, message: 'Relatórios TSE listados' };
  }

  async updateTseReport(
    campaignId: string,
    reportId: string,
    dto: UpdateTseReportDto,
    actor: JwtPayload,
  ) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    const cleanData: any = { updated_at: new Date() };
    if (dto.type !== undefined) cleanData.type = dto.type;
    if (dto.reference !== undefined) cleanData.reference = dto.reference;
    if (dto.period_start !== undefined) cleanData.period_start = new Date(dto.period_start);
    if (dto.period_end !== undefined) cleanData.period_end = new Date(dto.period_end);
    if (dto.notes !== undefined) cleanData.notes = dto.notes;
    if (dto.tse_protocol !== undefined) cleanData.tse_protocol = dto.tse_protocol;

    const result = await this.prisma.tse_reports.updateMany({
      where: { id: BigInt(reportId), campaign_id: BigInt(campaignId), tenant_id: tenantId },
      data: cleanData,
    });

    if (result.count === 0) throw new NotFoundException('Relatório TSE não encontrado');

    const report = await this.prisma.tse_reports.findFirst({
      where: { id: BigInt(reportId) },
      include: { items: true },
    });

    await this.audit(tenantId, userId, 'UPDATE', 'tse_reports', BigInt(reportId), dto);
    return { data: report, message: 'Relatório TSE atualizado' };
  }

  async addTseReportItem(
    campaignId: string,
    reportId: string,
    dto: CreateTseReportItemDto,
    actor: JwtPayload,
  ) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    const report = await this.prisma.tse_reports.findFirst({
      where: { id: BigInt(reportId), campaign_id: BigInt(campaignId), tenant_id: tenantId },
    });
    if (!report) throw new NotFoundException('Relatório TSE não encontrado');

    if (report.status === 'submitted' || report.status === 'accepted') {
      throw new BadRequestException('Relatório já submetido — não pode ser alterado');
    }

    const item = await this.prisma.tse_report_items.create({
      data: {
        tenant_id: tenantId,
        report_id: BigInt(reportId),
        tse_code: dto.tse_code,
        direction: dto.direction as any,
        amount: dto.amount,
        description: dto.description,
        reference_date: dto.reference_date ?? null,
        notes: dto.notes ?? null,
        created_by: userId,
      },
    });

    await this.audit(tenantId, userId, 'CREATE', 'tse_report_items', item.id, dto);
    return { data: item, message: 'Item adicionado ao relatório TSE' };
  }

  async submitTseReport(campaignId: string, reportId: string, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);

    const report = await this.prisma.tse_reports.findFirst({
      where: { id: BigInt(reportId), campaign_id: BigInt(campaignId), tenant_id: tenantId },
    });
    if (!report) throw new NotFoundException('Relatório TSE não encontrado');

    if (report.status !== 'draft') {
      throw new BadRequestException('Apenas relatórios em rascunho podem ser submetidos');
    }

    const result = await this.prisma.tse_reports.updateMany({
      where: { id: BigInt(reportId), tenant_id: tenantId },
      data: { status: 'submitted', submitted_at: new Date(), updated_at: new Date() },
    });

    if (result.count === 0) throw new NotFoundException('Relatório TSE não encontrado');

    const updated = await this.prisma.tse_reports.findFirst({
      where: { id: BigInt(reportId) },
      include: { items: true },
    });

    await this.audit(tenantId, userId, 'UPDATE', 'tse_reports', BigInt(reportId), { action: 'submit' });
    return { data: updated, message: 'Relatório TSE submetido ao TSE' };
  }
}

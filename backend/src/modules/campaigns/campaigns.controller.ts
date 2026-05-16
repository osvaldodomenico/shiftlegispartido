import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
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
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  // ── CAMPAIGNS CRUD ────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCampaignDto, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.create(dto, actor);
  }

  @Get()
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('election_id') electionId?: string,
  ) {
    return this.campaignsService.findAll(actor, electionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.findOne(id, actor);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.remove(id, actor);
  }

  // ── TEAM ──────────────────────────────────────────────────────────────────

  @Post(':id/team')
  @HttpCode(HttpStatus.CREATED)
  addTeamMember(
    @Param('id') id: string,
    @Body() dto: CreateTeamMemberDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.addTeamMember(id, dto, actor);
  }

  @Get(':id/team')
  listTeam(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.listTeam(id, actor);
  }

  @Patch(':id/team/:memberId')
  updateTeamMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateTeamMemberDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.updateTeamMember(id, memberId, dto, actor);
  }

  @Delete(':id/team/:memberId')
  @HttpCode(HttpStatus.OK)
  removeTeamMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.removeTeamMember(id, memberId, actor);
  }

  // ── CONTRACTS ─────────────────────────────────────────────────────────────

  @Post(':id/contracts')
  @HttpCode(HttpStatus.CREATED)
  addContract(
    @Param('id') id: string,
    @Body() dto: CreateContractDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.addContract(id, dto, actor);
  }

  @Get(':id/contracts')
  listContracts(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.listContracts(id, actor);
  }

  @Patch(':id/contracts/:contractId')
  updateContract(
    @Param('id') id: string,
    @Param('contractId') contractId: string,
    @Body() dto: UpdateContractDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.updateContract(id, contractId, dto, actor);
  }

  @Delete(':id/contracts/:contractId')
  @HttpCode(HttpStatus.OK)
  removeContract(
    @Param('id') id: string,
    @Param('contractId') contractId: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.removeContract(id, contractId, actor);
  }

  @Post(':id/contracts/:contractId/payments')
  @HttpCode(HttpStatus.CREATED)
  addContractPayment(
    @Param('id') id: string,
    @Param('contractId') contractId: string,
    @Body() dto: CreateContractPaymentDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.addContractPayment(id, contractId, dto, actor);
  }

  // ── SCHEDULE ──────────────────────────────────────────────────────────────

  @Post(':id/schedule')
  @HttpCode(HttpStatus.CREATED)
  createScheduleEvent(
    @Param('id') id: string,
    @Body() dto: CreateScheduleEventDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.createScheduleEvent(id, dto, actor);
  }

  @Get(':id/schedule')
  listSchedule(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.listSchedule(id, actor);
  }

  @Patch(':id/schedule/:eventId')
  updateScheduleEvent(
    @Param('id') id: string,
    @Param('eventId') eventId: string,
    @Body() dto: UpdateScheduleEventDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.updateScheduleEvent(id, eventId, dto, actor);
  }

  @Delete(':id/schedule/:eventId')
  @HttpCode(HttpStatus.OK)
  removeScheduleEvent(
    @Param('id') id: string,
    @Param('eventId') eventId: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.removeScheduleEvent(id, eventId, actor);
  }

  // ── TSE REPORTS ───────────────────────────────────────────────────────────

  @Post(':id/tse-reports')
  @HttpCode(HttpStatus.CREATED)
  createTseReport(
    @Param('id') id: string,
    @Body() dto: CreateTseReportDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.createTseReport(id, dto, actor);
  }

  @Get(':id/tse-reports')
  listTseReports(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.listTseReports(id, actor);
  }

  @Patch(':id/tse-reports/:reportId')
  updateTseReport(
    @Param('id') id: string,
    @Param('reportId') reportId: string,
    @Body() dto: UpdateTseReportDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.updateTseReport(id, reportId, dto, actor);
  }

  @Post(':id/tse-reports/:reportId/items')
  @HttpCode(HttpStatus.CREATED)
  addTseReportItem(
    @Param('id') id: string,
    @Param('reportId') reportId: string,
    @Body() dto: CreateTseReportItemDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.addTseReportItem(id, reportId, dto, actor);
  }

  @Post(':id/tse-reports/:reportId/submit')
  @HttpCode(HttpStatus.OK)
  submitTseReport(
    @Param('id') id: string,
    @Param('reportId') reportId: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.submitTseReport(id, reportId, actor);
  }
}

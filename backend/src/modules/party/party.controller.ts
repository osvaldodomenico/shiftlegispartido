import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PartyService } from './party.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { AddChapterMemberDto } from './dto/add-chapter-member.dto';
import { CreateOrganDto } from './dto/create-organ.dto';
import { UpdateOrganDto } from './dto/update-organ.dto';
import { AddOrganMemberDto } from './dto/add-organ-member.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('party')
export class PartyController {
  constructor(private readonly partyService: PartyService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // CAPÍTULOS — /party/chapters
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('chapters')
  @HttpCode(HttpStatus.CREATED)
  createChapter(
    @Body() dto: CreateChapterDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.partyService.createChapter(dto, actor);
  }

  /** Retorna árvore hierárquica: raízes com children aninhados */
  @Get('chapters')
  findAllChapters(@CurrentUser() actor: JwtPayload) {
    return this.partyService.findAllChapters(actor);
  }

  @Get('chapters/:id')
  findOneChapter(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.partyService.findOneChapter(BigInt(id), actor.tenantId);
  }

  @Patch('chapters/:id')
  updateChapter(
    @Param('id') id: string,
    @Body() dto: UpdateChapterDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.partyService.updateChapter(id, dto, actor);
  }

  @Delete('chapters/:id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  removeChapter(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.partyService.removeChapter(id, actor);
  }

  // ─── Membros de capítulo — /party/chapters/:id/members ───────────────────

  @Post('chapters/:id/members')
  @HttpCode(HttpStatus.CREATED)
  addChapterMember(
    @Param('id') id: string,
    @Body() dto: AddChapterMemberDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.partyService.addChapterMember(id, dto, actor);
  }

  @Get('chapters/:id/members')
  listChapterMembers(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.partyService.listChapterMembers(id, actor);
  }

  @Delete('chapters/:id/members/:memberId')
  @HttpCode(HttpStatus.OK)
  removeChapterMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.partyService.removeChapterMember(id, memberId, actor);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ÓRGÃOS — /party/organs
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('organs')
  @HttpCode(HttpStatus.CREATED)
  createOrgan(
    @Body() dto: CreateOrganDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.partyService.createOrgan(dto, actor);
  }

  @Get('organs')
  findAllOrgans(@CurrentUser() actor: JwtPayload) {
    return this.partyService.findAllOrgans(actor);
  }

  @Get('organs/:id')
  findOneOrgan(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.partyService.findOneOrgan(BigInt(id), actor.tenantId);
  }

  @Patch('organs/:id')
  updateOrgan(
    @Param('id') id: string,
    @Body() dto: UpdateOrganDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.partyService.updateOrgan(id, dto, actor);
  }

  @Delete('organs/:id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  removeOrgan(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.partyService.removeOrgan(id, actor);
  }

  // ─── Membros de órgão — /party/organs/:id/members ────────────────────────

  @Post('organs/:id/members')
  @HttpCode(HttpStatus.CREATED)
  addOrganMember(
    @Param('id') id: string,
    @Body() dto: AddOrganMemberDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.partyService.addOrganMember(id, dto, actor);
  }

  @Get('organs/:id/members')
  listOrganMembers(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.partyService.listOrganMembers(id, actor);
  }

  @Delete('organs/:id/members/:memberId')
  @HttpCode(HttpStatus.OK)
  removeOrganMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.partyService.removeOrganMember(id, memberId, actor);
  }
}

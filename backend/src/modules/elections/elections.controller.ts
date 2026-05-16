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
import { ElectionsService } from './elections.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('electoral/elections')
export class ElectionsController {
  constructor(private readonly electionsService: ElectionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager')
  create(@Body() dto: CreateElectionDto, @CurrentUser() actor: JwtPayload) {
    return this.electionsService.create(dto, actor);
  }

  @Get()
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.electionsService.findAll(actor);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.electionsService.findOne(id, actor);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateElectionDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.electionsService.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  remove(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.electionsService.remove(id, actor);
  }
}

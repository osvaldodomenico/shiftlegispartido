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
import { MandatesService } from './mandates.service';
import { CreateMandateDto } from './dto/create-mandate.dto';
import { UpdateMandateDto } from './dto/update-mandate.dto';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('mandates')
export class MandatesController {
  constructor(private readonly mandatesService: MandatesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager')
  create(@Body() dto: CreateMandateDto, @CurrentUser() actor: JwtPayload) {
    return this.mandatesService.create(dto, actor);
  }

  @Get()
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.mandatesService.findAll(actor);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.mandatesService.findOne(id, actor);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMandateDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.mandatesService.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  remove(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.mandatesService.remove(id, actor);
  }
}

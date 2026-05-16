import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CrmImportService } from './crm-import.service';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

@Controller('crm/import')
export class CrmImportController {
  constructor(private readonly crmImportService: CrmImportService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(@UploadedFile() file: Express.Multer.File, @CurrentUser() actor: JwtPayload) {
    return this.crmImportService.startImport(file, actor);
  }

  @Get()
  list(@CurrentUser() actor: JwtPayload) {
    return this.crmImportService.listImports(actor);
  }

  @Get(':id')
  getStatus(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.crmImportService.getImportStatus(id, actor);
  }
}

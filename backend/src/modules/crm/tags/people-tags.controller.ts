import {
  Controller, Post, Delete,
  Body, Param, HttpCode, HttpStatus,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { AttachTagsDto } from './dto/attach-tags.dto';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

@Controller('crm/people')
export class PeopleTagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post(':id/tags')
  @HttpCode(HttpStatus.CREATED)
  attach(
    @Param('id') peopleId: string,
    @Body() dto: AttachTagsDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.tagsService.attachTags(peopleId, dto, actor);
  }

  @Delete(':id/tags/:tagId')
  @HttpCode(HttpStatus.OK)
  detach(
    @Param('id') peopleId: string,
    @Param('tagId') tagId: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.tagsService.detachTag(peopleId, tagId, actor);
  }
}

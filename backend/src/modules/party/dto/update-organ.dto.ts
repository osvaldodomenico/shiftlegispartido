import { PartialType } from '@nestjs/mapped-types';
import { CreateOrganDto } from './create-organ.dto';

export class UpdateOrganDto extends PartialType(CreateOrganDto) {}

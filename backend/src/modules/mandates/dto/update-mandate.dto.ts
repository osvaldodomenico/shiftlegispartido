import { PartialType } from '@nestjs/mapped-types';
import { CreateMandateDto } from './create-mandate.dto';

// Todos os campos de CreateMandateDto tornam-se opcionais no update
export class UpdateMandateDto extends PartialType(CreateMandateDto) {}

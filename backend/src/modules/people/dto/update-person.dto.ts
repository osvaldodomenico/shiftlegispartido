import { PartialType } from '@nestjs/mapped-types';
import { CreatePersonDto } from './create-person.dto';

/**
 * Todos os campos opcionais. CPF, se informado, é revalidado e recriptografado.
 */
export class UpdatePersonDto extends PartialType(CreatePersonDto) {}

import { IsEnum, IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { interaction_type, interaction_direction } from '@prisma/client';

export class CreateInteractionDto {
  // ID da pessoa associada à interação (BigInt serializado como string)
  @IsString()
  @IsNotEmpty()
  person_id: string;

  @IsEnum(interaction_type)
  type: interaction_type;

  @IsEnum(interaction_direction)
  direction: interaction_direction;

  @IsString()
  @IsNotEmpty()
  summary: string;

  @IsDateString()
  occurred_at: string;
}

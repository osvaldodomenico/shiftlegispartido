import { IsString, IsOptional, IsNumberString, MaxLength, IsDateString } from 'class-validator';

export class AddOrganMemberDto {
  /** BigInt person_id enviado como string numérica */
  @IsNumberString()
  person_id: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  role?: string;

  @IsDateString()
  joined_at: string;
}

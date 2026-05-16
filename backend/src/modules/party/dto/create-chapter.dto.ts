import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumberString,
  MaxLength,
  Length,
} from 'class-validator';

export enum ChapterLevel {
  nacional = 'nacional',
  estadual = 'estadual',
  municipal = 'municipal',
  zonal = 'zonal',
  setorial = 'setorial',
}

export class CreateChapterDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsEnum(ChapterLevel)
  level: ChapterLevel;

  @IsString()
  @Length(2, 2)
  @IsOptional()
  state?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  zone?: string;

  /** ID BigInt enviado como string numérica */
  @IsNumberString()
  @IsOptional()
  parent_id?: string;
}

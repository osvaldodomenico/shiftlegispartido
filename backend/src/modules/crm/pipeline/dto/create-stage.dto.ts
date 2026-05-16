import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean, Matches, IsEnum, MaxLength } from 'class-validator';

export class CreateStageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsInt()
  order_index: number;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;

  @IsOptional()
  @IsBoolean()
  is_final?: boolean;

  @IsOptional()
  @IsEnum(['filiado', 'simpatizante', 'voluntario', 'doador', 'eleitor'])
  target_people_type?: string;
}

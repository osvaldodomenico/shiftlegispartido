import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateCostCenterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  /**
   * Código identificador único por tenant.
   * Ex: "ADM-01", "MKT", "CAMP-2026"
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsString()
  @IsOptional()
  description?: string;
}

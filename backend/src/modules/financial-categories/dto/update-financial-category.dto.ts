import { IsString, IsEnum, IsOptional, IsBoolean, MaxLength, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { CategoryType } from './create-financial-category.dto';

export class UpdateFinancialCategoryDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEnum(CategoryType, { message: 'type deve ser: income | expense | both' })
  @IsOptional()
  type?: CategoryType;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  parent_id?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

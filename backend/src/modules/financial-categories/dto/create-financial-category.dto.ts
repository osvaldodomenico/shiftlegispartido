import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsPositive,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
  BOTH = 'both',
}

export class CreateFinancialCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEnum(CategoryType, { message: 'type deve ser: income | expense | both' })
  type: CategoryType;

  /**
   * ID da categoria pai — permite hierarquia de dois níveis.
   * Null = categoria raiz.
   */
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  parent_id?: number;
}

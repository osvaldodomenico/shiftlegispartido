import { IsArray, ValidateNested, IsUUID, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class StageOrderItem {
  @IsUUID()
  id: string;

  @IsInt()
  order_index: number;
}

export class ReorderStagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StageOrderItem)
  order: StageOrderItem[];
}

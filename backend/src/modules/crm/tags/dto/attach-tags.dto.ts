import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class AttachTagsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  tag_ids: string[];
}

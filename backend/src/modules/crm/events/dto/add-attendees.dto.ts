import { IsArray, ArrayMinSize, IsString, IsNotEmpty } from 'class-validator';

export class AddAttendeesDto {
  // Lista de IDs (BigInt como string) das pessoas a adicionar como participantes
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  person_ids: string[];
}

import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { task_status, task_priority } from '@prisma/client';

export class UpdateTaskDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  due_date?: string;

  @IsEnum(task_status)
  @IsOptional()
  status?: task_status;

  @IsEnum(task_priority)
  @IsOptional()
  priority?: task_priority;

  // Reatribuição da tarefa para outro usuário do tenant
  @IsString()
  @IsOptional()
  assigned_to?: string;

  @IsString()
  @IsOptional()
  person_id?: string;
}

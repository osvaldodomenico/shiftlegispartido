import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { task_status, task_priority } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Data de vencimento da tarefa (ISO date string)
  @IsDateString()
  due_date: string;

  @IsEnum(task_status)
  @IsOptional()
  status?: task_status;

  @IsEnum(task_priority)
  @IsOptional()
  priority?: task_priority;

  // ID do usuário responsável pela tarefa (BigInt serializado como string)
  @IsString()
  @IsNotEmpty()
  assigned_to: string;

  // ID da pessoa do CRM associada à tarefa (opcional)
  @IsString()
  @IsOptional()
  person_id?: string;
}

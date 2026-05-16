import { IsString, IsISO8601, IsOptional, MaxLength, IsEnum } from 'class-validator';

export enum ScheduleEventType {
  comicio = 'comicio',
  reuniao = 'reuniao',
  entrevista = 'entrevista',
  debate = 'debate',
  visita = 'visita',
  carreata = 'carreata',
  outro = 'outro',
}

export enum ScheduleEventStatus {
  planned = 'planned',
  confirmed = 'confirmed',
  done = 'done',
  cancelled = 'cancelled',
}

export class CreateScheduleEventDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsEnum(ScheduleEventType)
  type: ScheduleEventType;

  @IsEnum(ScheduleEventStatus)
  @IsOptional()
  status?: ScheduleEventStatus;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  location?: string;

  @IsISO8601()
  start_at: string;

  @IsISO8601()
  @IsOptional()
  end_at?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

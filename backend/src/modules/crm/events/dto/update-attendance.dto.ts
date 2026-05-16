import { IsEnum } from 'class-validator';

export enum EventAttendanceStatus {
  INVITED = 'invited',
  CONFIRMED = 'confirmed',
  DECLINED = 'declined',
  ATTENDED = 'attended',
}

export class UpdateAttendanceDto {
  // Atualiza o status de presença de um participante
  @IsEnum(EventAttendanceStatus)
  status: EventAttendanceStatus;
}

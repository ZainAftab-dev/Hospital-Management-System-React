import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class UpsertAppointmentDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  patientId!: string;

  @IsString()
  doctorId!: string;

  @IsDateString({}, { message: 'Date must be a valid ISO date string (e.g. 2026-05-18)' })
  date!: string;

  @IsString()
  time!: string;

  @IsString()
  @IsIn(['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    { message: 'Status must be Pending, Confirmed, Completed, or Cancelled' })
  status!: string;

  @IsOptional()
  @IsString()
  @IsIn(['In-Person', 'Follow-up', 'Emergency'],
    { message: 'Type must be In-Person, Follow-up, or Emergency' })
  type?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

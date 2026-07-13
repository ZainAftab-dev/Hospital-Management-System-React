import { IsDateString, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

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
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Time must be in HH:MM format (24-hour, e.g. 09:30)' })
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
  @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
  notes?: string;
}

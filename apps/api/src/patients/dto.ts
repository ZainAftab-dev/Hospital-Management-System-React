import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

// Letters, spaces, dots, hyphens, apostrophes (covers most names e.g. "Dr. Ali", "Abdul-Rahman")
const NAME_RE = /^[a-zA-Z][a-zA-Z\s.'\-]*$/;
// Digits, spaces, hyphens, parentheses, leading + (covers 0321-1234567, +92 321 ...)
const PHONE_RE = /^\+?[\d\s\-()+]{7,20}$/;

export class UpsertPatientDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @Matches(NAME_RE, { message: 'Name must contain only letters, spaces, dots, or hyphens' })
  name!: string;

  @IsInt()
  @Min(0,  { message: 'Age cannot be negative' })
  @Max(150, { message: 'Age cannot exceed 150' })
  age!: number;

  @IsString()
  @IsIn(['Male', 'Female', 'Other'], { message: 'Gender must be Male, Female, or Other' })
  gender!: string;

  @IsString()
  @Matches(PHONE_RE, { message: 'Contact must be a valid phone number (7–20 digits)' })
  contact!: string;

  @IsOptional()
  @ValidateIf(o => !!o.email)
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  disease?: string;

  @IsOptional()
  @ValidateIf(o => !!o.bloodGroup)
  @IsIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    { message: 'Blood group must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-' })
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @ValidateIf(o => !!o.emergencyPhone)
  @Matches(PHONE_RE, { message: 'Emergency phone must be a valid phone number' })
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsIn(['Stable', 'Critical', 'Emergency', 'Under Observation', 'Discharged'],
    { message: 'Status must be: Stable, Critical, Emergency, Under Observation, or Discharged' })
  status?: string;
}

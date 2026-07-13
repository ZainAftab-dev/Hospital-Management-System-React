import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const NAME_RE  = /^[a-zA-Z][a-zA-Z\s.'\-]*$/;
const PHONE_RE = /^\+?[\d\s\-()+]{7,20}$/;

export class UpsertDoctorDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @Matches(NAME_RE, { message: 'Name must contain only letters, spaces, dots, or hyphens' })
  name!: string;

  @IsInt()
  @Min(18,  { message: 'Doctor age must be at least 18' })
  @Max(100, { message: 'Doctor age cannot exceed 100' })
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
  @MaxLength(500, { message: 'Address cannot exceed 500 characters' })
  address?: string;

  @IsString()
  @MaxLength(100, { message: 'Specialization cannot exceed 100 characters' })
  specialization!: string;

  @IsString()
  @MaxLength(200, { message: 'Qualification cannot exceed 200 characters' })
  qualification!: string;

  @IsString()
  @IsIn(['yes', 'no'], { message: 'Availability must be yes or no' })
  availability!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'Consultation fee must be a positive number (e.g. 1500 or 750.50)' })
  consultationFee!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'License number cannot exceed 50 characters' })
  licenseNumber?: string;
}

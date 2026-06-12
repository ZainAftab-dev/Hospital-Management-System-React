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
  address?: string;

  @IsString()
  specialization!: string;

  @IsString()
  qualification!: string;

  @IsString()
  @IsIn(['yes', 'no'], { message: 'Availability must be yes or no' })
  availability!: string;

  @IsString()
  consultationFee!: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;
}

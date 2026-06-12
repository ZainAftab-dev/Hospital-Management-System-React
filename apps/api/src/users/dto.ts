import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

const NAME_RE = /^[a-zA-Z][a-zA-Z\s.'\-]*$/;

export class CreateUserDto {
  @IsString()
  @Matches(NAME_RE, { message: 'Name must contain only letters, spaces, dots, or hyphens' })
  name!: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsString()
  @IsIn(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST', 'STAFF'],
    { message: 'Role must be ADMIN, DOCTOR, RECEPTIONIST, PHARMACIST, or STAFF' })
  role!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Active', 'Inactive', 'Suspended'],
    { message: 'Status must be Active, Inactive, or Suspended' })
  status?: string;
}

export class UpdateUserDto extends CreateUserDto {}

import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpsertMedicineDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name!: string;

  @IsString()
  manufacturer!: string;

  @IsString()
  category!: string;

  @IsInt()
  @Min(0,        { message: 'Price cannot be negative' })
  @Max(100_000_00, { message: 'Price cannot exceed Rs. 1,000,000' })
  priceCents!: number;

  @IsInt()
  @Min(0,      { message: 'Stock quantity cannot be negative' })
  @Max(999_999, { message: 'Stock quantity exceeds maximum allowed (999,999)' })
  quantity!: number;

  @IsInt()
  @Min(0, { message: 'Reorder level cannot be negative' })
  reorderLevel!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class DispenseItemDto {
  @IsString()
  medicineId!: string;

  @IsInt()
  @Min(1, { message: 'Quantity to dispense must be at least 1' })
  quantity!: number;

  @IsString()
  dosage!: string;

  @IsString()
  frequency!: string;

  @IsString()
  duration!: string;
}

export class DispenseMedicineDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Must dispense at least one medicine' })
  @ValidateNested({ each: true })
  @Type(() => DispenseItemDto)
  items!: DispenseItemDto[];
}

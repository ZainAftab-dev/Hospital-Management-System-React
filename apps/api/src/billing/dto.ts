import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class InvoiceItemDto {
  @IsString()
  description!: string;

  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity!: number;

  @IsInt()
  @Min(0, { message: 'Unit price cannot be negative' })
  unitPriceCents!: number;

  @IsInt()
  @Min(0, { message: 'Amount cannot be negative' })
  amountCents!: number;

  @IsOptional()
  @IsString()
  @IsIn(['PHARMACY', 'MANUAL'], { message: 'sourceType must be PHARMACY or MANUAL' })
  sourceType?: string;

  @IsOptional()
  @IsString()
  sourceId?: string;
}

export class UpsertInvoiceDto {
  @IsString()
  invoiceNo!: string;

  @IsString()
  patientId!: string;

  @IsString()
  @IsIn(['DRAFT', 'UNPAID', 'PAID'], { message: 'Status must be DRAFT, UNPAID, or PAID' })
  status!: string;

  @IsInt()
  @Min(0, { message: 'Discount cannot be negative' })
  discountCents!: number;

  @IsInt()
  @Min(0, { message: 'Tax cannot be negative' })
  taxCents!: number;

  @IsOptional()
  @ValidateIf(o => !!o.paymentMode)
  @IsIn(['Cash', 'Card', 'Online'], { message: 'Payment mode must be Cash, Card, or Online' })
  paymentMode?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Invoice must have at least one item' })
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items!: InvoiceItemDto[];
}

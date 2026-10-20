import { IsInt, IsNumber, Max, Min } from 'class-validator';

export class RecordVitalDto {
  @IsInt()
  @Min(20)
  @Max(250)
  heartRate!: number;

  @IsInt()
  @Min(50)
  @Max(260)
  systolic!: number;

  @IsInt()
  @Min(30)
  @Max(160)
  diastolic!: number;

  @IsInt()
  @Min(50)
  @Max(100)
  spo2!: number;

  @IsNumber()
  @Min(30)
  @Max(45)
  temperatureC!: number;
}

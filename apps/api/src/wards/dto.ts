import { IsInt, Min } from 'class-validator';

export class UpdateWardOccupancyDto {
  @IsInt()
  @Min(0)
  occupiedBeds!: number;
}

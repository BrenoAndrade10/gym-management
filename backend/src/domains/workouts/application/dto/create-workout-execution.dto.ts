import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateWorkoutExecutionDto {
  @IsOptional()
  @IsDateString()
  executedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class WorkoutExerciseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  exerciseName: string;

  @IsInt()
  @Min(1)
  @Max(99)
  sets: number;

  @IsInt()
  @Min(1)
  @Max(999)
  repetitions: number;
}

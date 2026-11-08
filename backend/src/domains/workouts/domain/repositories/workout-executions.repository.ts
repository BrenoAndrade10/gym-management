import { WorkoutExecution } from '../entities/workout-execution.entity';

export const WORKOUT_EXECUTIONS_REPOSITORY = Symbol('WORKOUT_EXECUTIONS_REPOSITORY');

export abstract class WorkoutExecutionsRepository {
  abstract create(execution: WorkoutExecution): Promise<WorkoutExecution>;
  abstract findAll(studentId?: string): Promise<WorkoutExecution[]>;
  abstract findByWorkoutId(workoutId: string): Promise<WorkoutExecution[]>;
}

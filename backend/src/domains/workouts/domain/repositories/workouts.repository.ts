import { Workout } from '../entities/workout.entity';

export const WORKOUTS_REPOSITORY = Symbol('WORKOUTS_REPOSITORY');

export abstract class WorkoutsRepository {
  abstract create(workout: Workout): Promise<Workout>;
  abstract findAll(): Promise<Workout[]>;
  abstract findById(id: string): Promise<Workout | null>;
  abstract findByStudentId(studentId: string): Promise<Workout[]>;
  abstract save(workout: Workout): Promise<Workout>;
  abstract delete(id: string): Promise<void>;
}

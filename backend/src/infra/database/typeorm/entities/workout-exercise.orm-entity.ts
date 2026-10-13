import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { WorkoutOrmEntity } from './workout.orm-entity';

@Entity('workout_exercises')
export class WorkoutExerciseOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'workout_id', type: 'uuid' })
  workoutId: string;

  @ManyToOne(() => WorkoutOrmEntity, (workout) => workout.exercises, {
    orphanedRowAction: 'delete',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workout_id' })
  workout: WorkoutOrmEntity;

  @Column({ name: 'exercise_name', length: 120 })
  exerciseName: string;

  @Column({ type: 'int' })
  sets: number;

  @Column({ type: 'int' })
  repetitions: number;

  @Column({ type: 'int' })
  order: number;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: string;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: string;
}

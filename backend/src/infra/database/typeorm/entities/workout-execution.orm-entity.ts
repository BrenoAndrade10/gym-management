import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';
import { WorkoutOrmEntity } from './workout.orm-entity';

@Entity('workout_executions')
export class WorkoutExecutionOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'workout_id', type: 'uuid' })
  workoutId: string;

  @ManyToOne(() => WorkoutOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workout_id' })
  workout: WorkoutOrmEntity;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => StudentOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: StudentOrmEntity;

  @Column({ name: 'executed_at', type: 'timestamptz' })
  executedAt: string;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ length: 500, nullable: true })
  notes?: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: string;
}

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';
import { WorkoutExerciseOrmEntity } from './workout-exercise.orm-entity';

@Entity('workouts')
export class WorkoutOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => StudentOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: StudentOrmEntity;

  @Column({ length: 120 })
  title: string;

  @Column({ length: 500, nullable: true })
  notes?: string;

  @OneToMany(() => WorkoutExerciseOrmEntity, (exercise) => exercise.workout, {
    cascade: true,
  })
  exercises: WorkoutExerciseOrmEntity[];

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: string;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: string;
}

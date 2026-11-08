import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentOrmEntity } from '../../infra/database/typeorm/entities/student.orm-entity';
import { WorkoutExerciseOrmEntity } from '../../infra/database/typeorm/entities/workout-exercise.orm-entity';
import { WorkoutOrmEntity } from '../../infra/database/typeorm/entities/workout.orm-entity';
import { WorkoutExecutionOrmEntity } from '../../infra/database/typeorm/entities/workout-execution.orm-entity';
import { TypeOrmStudentsRepository } from '../../infra/repositories/typeorm-students.repository';
import { TypeOrmWorkoutsRepository } from '../../infra/repositories/typeorm-workouts.repository';
import { TypeOrmWorkoutExecutionsRepository } from '../../infra/repositories/typeorm-workout-executions.repository';
import { STUDENTS_REPOSITORY } from '../students/domain/repositories/students.repository';
import { WorkoutsService } from './application/services/workouts.service';
import { WORKOUTS_REPOSITORY } from './domain/repositories/workouts.repository';
import { WORKOUT_EXECUTIONS_REPOSITORY } from './domain/repositories/workout-executions.repository';
import { WorkoutsController } from './presentation/http/workouts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentOrmEntity,
      WorkoutOrmEntity,
      WorkoutExerciseOrmEntity,
      WorkoutExecutionOrmEntity,
    ]),
  ],
  controllers: [WorkoutsController],
  providers: [
    WorkoutsService,
    {
      provide: WORKOUTS_REPOSITORY,
      useClass: TypeOrmWorkoutsRepository,
    },
    {
      provide: WORKOUT_EXECUTIONS_REPOSITORY,
      useClass: TypeOrmWorkoutExecutionsRepository,
    },
    {
      provide: STUDENTS_REPOSITORY,
      useClass: TypeOrmStudentsRepository,
    },
  ],
})
export class WorkoutsModule {}

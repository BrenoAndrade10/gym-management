import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from '../../domains/workouts/domain/entities/workout.entity';
import { WorkoutsRepository } from '../../domains/workouts/domain/repositories/workouts.repository';
import { WorkoutExerciseOrmEntity } from '../database/typeorm/entities/workout-exercise.orm-entity';
import { WorkoutOrmEntity } from '../database/typeorm/entities/workout.orm-entity';

@Injectable()
export class TypeOrmWorkoutsRepository implements WorkoutsRepository {
  constructor(
    @InjectRepository(WorkoutOrmEntity)
    private readonly repository: Repository<WorkoutOrmEntity>,
  ) {}

  async create(workout: Workout) {
    const workoutEntity = this.repository.create(workout);
    await this.repository.save(workoutEntity);
    const savedWorkout = await this.findById(workout.id);

    if (!savedWorkout) {
      throw new Error('Workout was not found after creation');
    }

    return savedWorkout;
  }

  async findAll() {
    const workouts = await this.repository.find({
      order: {
        createdAt: 'DESC',
        exercises: {
          order: 'ASC',
        },
      },
      relations: {
        exercises: true,
      },
    });

    return workouts.map((workout) => this.toDomain(workout));
  }

  async findById(id: string) {
    const workout = await this.repository.findOne({
      order: {
        exercises: {
          order: 'ASC',
        },
      },
      relations: {
        exercises: true,
      },
      where: { id },
    });

    return workout ? this.toDomain(workout) : null;
  }

  async findByStudentId(studentId: string) {
    const workouts = await this.repository.find({
      order: {
        createdAt: 'DESC',
        exercises: {
          order: 'ASC',
        },
      },
      relations: {
        exercises: true,
      },
      where: { studentId },
    });

    return workouts.map((workout) => this.toDomain(workout));
  }

  async save(workout: Workout) {
    await this.repository.manager.transaction(async (entityManager) => {
      await entityManager.delete(WorkoutExerciseOrmEntity, {
        workoutId: workout.id,
      });
      await entityManager.save(
        WorkoutOrmEntity,
        this.repository.create(workout),
      );
    });

    const savedWorkout = await this.findById(workout.id);

    if (!savedWorkout) {
      throw new Error('Workout was not found after saving');
    }

    return savedWorkout;
  }

  async delete(id: string) {
    await this.repository.delete(id);
  }

  private toDomain(workout: WorkoutOrmEntity): Workout {
    return {
      id: workout.id,
      studentId: workout.studentId,
      title: workout.title,
      notes: workout.notes,
      exercises: (workout.exercises ?? [])
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((exercise) => ({
          id: exercise.id,
          workoutId: exercise.workoutId,
          exerciseName: exercise.exerciseName,
          sets: exercise.sets,
          repetitions: exercise.repetitions,
          order: exercise.order,
          createdAt: exercise.createdAt,
          updatedAt: exercise.updatedAt,
        })),
      createdAt: workout.createdAt,
      updatedAt: workout.updatedAt,
    };
  }
}

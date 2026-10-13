import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  STUDENTS_REPOSITORY,
  StudentsRepository,
} from '../../../students/domain/repositories/students.repository';
import { Workout, WorkoutExercise } from '../../domain/entities/workout.entity';
import {
  WORKOUTS_REPOSITORY,
  WorkoutsRepository,
} from '../../domain/repositories/workouts.repository';
import { CreateWorkoutDto } from '../dto/create-workout.dto';
import { UpdateWorkoutDto } from '../dto/update-workout.dto';
import { WorkoutExerciseDto } from '../dto/workout-exercise.dto';

@Injectable()
export class WorkoutsService {
  constructor(
    @Inject(WORKOUTS_REPOSITORY)
    private readonly workoutsRepository: WorkoutsRepository,
    @Inject(STUDENTS_REPOSITORY)
    private readonly studentsRepository: StudentsRepository,
  ) {}

  async create(createWorkoutDto: CreateWorkoutDto) {
    await this.ensureStudentExists(createWorkoutDto.studentId);

    const now = new Date().toISOString();
    const workout: Workout = {
      id: randomUUID(),
      studentId: createWorkoutDto.studentId,
      title: createWorkoutDto.title,
      notes: createWorkoutDto.notes,
      exercises: this.createExercises(createWorkoutDto.exercises, now),
      createdAt: now,
      updatedAt: now,
    };

    workout.exercises = workout.exercises.map((exercise) => ({
      ...exercise,
      workoutId: workout.id,
    }));

    return this.workoutsRepository.create(workout);
  }

  async findAll(studentId?: string) {
    if (studentId) {
      await this.ensureStudentExists(studentId);
      return this.workoutsRepository.findByStudentId(studentId);
    }

    return this.workoutsRepository.findAll();
  }

  async findOne(id: string) {
    const workout = await this.workoutsRepository.findById(id);

    if (!workout) {
      throw new NotFoundException(`Workout with id "${id}" was not found`);
    }

    return workout;
  }

  async update(id: string, updateWorkoutDto: UpdateWorkoutDto) {
    const currentWorkout = await this.findOne(id);
    const now = new Date().toISOString();
    const updatedWorkout: Workout = {
      ...currentWorkout,
      title: updateWorkoutDto.title ?? currentWorkout.title,
      notes:
        updateWorkoutDto.notes !== undefined
          ? updateWorkoutDto.notes
          : currentWorkout.notes,
      exercises: updateWorkoutDto.exercises
        ? this.createExercises(updateWorkoutDto.exercises, now, id)
        : currentWorkout.exercises,
      updatedAt: now,
    };

    return this.workoutsRepository.save(updatedWorkout);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.workoutsRepository.delete(id);
  }

  private async ensureStudentExists(studentId: string) {
    const student = await this.studentsRepository.findById(studentId);

    if (!student) {
      throw new NotFoundException(
        `Student with id "${studentId}" was not found`,
      );
    }
  }

  private createExercises(
    exercises: WorkoutExerciseDto[],
    now: string,
    workoutId = '',
  ): WorkoutExercise[] {
    return exercises.map((exercise, index) => ({
      id: randomUUID(),
      workoutId,
      exerciseName: exercise.exerciseName,
      sets: exercise.sets,
      repetitions: exercise.repetitions,
      order: index + 1,
      createdAt: now,
      updatedAt: now,
    }));
  }
}

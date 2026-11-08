import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutExecution } from '../../domains/workouts/domain/entities/workout-execution.entity';
import { WorkoutExecutionsRepository } from '../../domains/workouts/domain/repositories/workout-executions.repository';
import { WorkoutExecutionOrmEntity } from '../database/typeorm/entities/workout-execution.orm-entity';

@Injectable()
export class TypeOrmWorkoutExecutionsRepository implements WorkoutExecutionsRepository {
  constructor(
    @InjectRepository(WorkoutExecutionOrmEntity)
    private readonly repository: Repository<WorkoutExecutionOrmEntity>,
  ) {}

  async create(execution: WorkoutExecution) {
    const saved = await this.repository.save(this.repository.create(execution));
    return this.toDomain(saved);
  }

  async findAll(studentId?: string) {
    const executions = await this.repository.find({
      where: studentId ? { studentId } : undefined,
      order: { executedAt: 'DESC' },
    });
    return executions.map((execution) => this.toDomain(execution));
  }

  async findByWorkoutId(workoutId: string) {
    const executions = await this.repository.find({
      where: { workoutId },
      order: { executedAt: 'DESC' },
    });
    return executions.map((execution) => this.toDomain(execution));
  }

  private toDomain(execution: WorkoutExecutionOrmEntity): WorkoutExecution {
    return {
      id: execution.id,
      workoutId: execution.workoutId,
      studentId: execution.studentId,
      executedAt: execution.executedAt,
      durationMinutes: execution.durationMinutes,
      notes: execution.notes,
      createdAt: execution.createdAt,
    };
  }
}

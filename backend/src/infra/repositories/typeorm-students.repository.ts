import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../domains/students/domain/entities/student.entity';
import { StudentsRepository } from '../../domains/students/domain/repositories/students.repository';
import { StudentOrmEntity } from '../database/typeorm/entities/student.orm-entity';

@Injectable()
export class TypeOrmStudentsRepository implements StudentsRepository {
  constructor(
    @InjectRepository(StudentOrmEntity)
    private readonly repository: Repository<StudentOrmEntity>,
  ) {}

  async create(student: Student) {
    const studentEntity = this.repository.create(student);
    const savedStudent = await this.repository.save(studentEntity);

    return this.toDomain(savedStudent);
  }

  async findAll() {
    const students = await this.repository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return students.map((student) => this.toDomain(student));
  }

  async findById(id: string) {
    const student = await this.repository.findOneBy({ id });

    return student ? this.toDomain(student) : null;
  }

  async findByEmail(email: string) {
    const student = await this.repository.findOneBy({ email });

    return student ? this.toDomain(student) : null;
  }

  async save(student: Student) {
    const studentEntity = this.repository.create(student);
    const savedStudent = await this.repository.save(studentEntity);

    return this.toDomain(savedStudent);
  }

  async delete(id: string) {
    await this.repository.delete(id);
  }

  private toDomain(student: StudentOrmEntity): Student {
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      birthDate: student.birthDate,
      enrollmentDate: student.enrollmentDate,
      status: student.status,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }
}

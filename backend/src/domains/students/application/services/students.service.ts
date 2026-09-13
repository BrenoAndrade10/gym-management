import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Student, StudentStatus } from '../../domain/entities/student.entity';
import {
  STUDENTS_REPOSITORY,
  StudentsRepository,
} from '../../domain/repositories/students.repository';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @Inject(STUDENTS_REPOSITORY)
    private readonly studentsRepository: StudentsRepository,
  ) {}

  async create(createStudentDto: CreateStudentDto) {
    await this.ensureEmailIsAvailable(createStudentDto.email);

    const now = new Date().toISOString();
    const student: Student = {
      id: randomUUID(),
      name: createStudentDto.name,
      email: createStudentDto.email,
      phone: createStudentDto.phone,
      birthDate: createStudentDto.birthDate,
      enrollmentDate: createStudentDto.enrollmentDate ?? now.slice(0, 10),
      status: createStudentDto.status ?? StudentStatus.Active,
      createdAt: now,
      updatedAt: now,
    };

    return this.studentsRepository.create(student);
  }

  async findAll() {
    return this.studentsRepository.findAll();
  }

  async findOne(id: string) {
    const student = await this.studentsRepository.findById(id);

    if (!student) {
      throw new NotFoundException(`Student with id "${id}" was not found`);
    }

    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const currentStudent = await this.findOne(id);

    if (
      updateStudentDto.email &&
      updateStudentDto.email !== currentStudent.email
    ) {
      await this.ensureEmailIsAvailable(updateStudentDto.email);
    }

    const updatePayload = this.removeUndefinedFields(updateStudentDto);
    const updatedStudent: Student = {
      ...currentStudent,
      ...updatePayload,
      updatedAt: new Date().toISOString(),
    };

    return this.studentsRepository.save(updatedStudent);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.studentsRepository.delete(id);
  }

  private async ensureEmailIsAvailable(email: string) {
    const student = await this.studentsRepository.findByEmail(email);

    if (student) {
      throw new ConflictException(
        `Student with email "${email}" already exists`,
      );
    }
  }

  private removeUndefinedFields(updateStudentDto: UpdateStudentDto) {
    return Object.fromEntries(
      Object.entries(updateStudentDto).filter(
        ([, value]) => value !== undefined,
      ),
    ) as UpdateStudentDto;
  }
}

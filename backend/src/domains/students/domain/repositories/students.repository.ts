import { Student } from '../entities/student.entity';

export const STUDENTS_REPOSITORY = Symbol('STUDENTS_REPOSITORY');

export abstract class StudentsRepository {
  abstract create(student: Student): Promise<Student>;
  abstract findAll(): Promise<Student[]>;
  abstract findById(id: string): Promise<Student | null>;
  abstract findByEmail(email: string): Promise<Student | null>;
  abstract save(student: Student): Promise<Student>;
  abstract delete(id: string): Promise<void>;
}

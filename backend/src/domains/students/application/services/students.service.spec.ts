import { ConflictException, NotFoundException } from '@nestjs/common';
import { Student, StudentStatus } from '../../domain/entities/student.entity';
import { StudentsRepository } from '../../domain/repositories/students.repository';
import { StudentsService } from './students.service';

describe('StudentsService', () => {
  let repository: jest.Mocked<StudentsRepository>;
  let service: StudentsService;

  const student: Student = {
    id: '9e3fb02a-0b3b-4786-a225-a18130f7082d',
    name: 'Ana Silva',
    email: 'ana@gym.test',
    phone: '11999999999',
    enrollmentDate: '2026-09-13',
    status: StudentStatus.Active,
    createdAt: '2026-09-13T00:00:00.000Z',
    updatedAt: '2026-09-13T00:00:00.000Z',
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };
    service = new StudentsService(repository);
  });

  it('creates and lists students', async () => {
    repository.findByEmail.mockResolvedValue(null);
    repository.create.mockImplementation((studentToCreate) =>
      Promise.resolve(studentToCreate),
    );

    const createdStudent = await service.create({
      name: 'Ana Silva',
      email: 'ana@gym.test',
      phone: '11999999999',
    });

    repository.findAll.mockResolvedValue([createdStudent]);

    expect(createdStudent.id).toBeDefined();
    expect(createdStudent.status).toBe('active');
    await expect(service.findAll()).resolves.toEqual([createdStudent]);
  });

  it('updates a student', async () => {
    repository.findById.mockResolvedValue(student);
    repository.save.mockImplementation((studentToSave) =>
      Promise.resolve(studentToSave),
    );

    const updatedStudent = await service.update(student.id, {
      phone: '11888888888',
    });

    expect(updatedStudent.phone).toBe('11888888888');
    expect(updatedStudent.name).toBe('Ana Silva');
    expect(updatedStudent.email).toBe('ana@gym.test');
    expect(updatedStudent.updatedAt).toEqual(expect.any(String));
  });

  it('removes a student', async () => {
    repository.findById.mockResolvedValue(student);
    repository.delete.mockResolvedValue();

    await service.remove(student.id);

    expect(repository.delete.mock.calls).toContainEqual([student.id]);
  });

  it('throws when a student is not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne(student.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('does not allow duplicated emails', async () => {
    repository.findByEmail.mockResolvedValue(student);

    await expect(
      service.create({
        name: 'Bruno Souza',
        email: 'ana@gym.test',
        phone: '11888888888',
      }),
    ).rejects.toThrow(ConflictException);
  });
});

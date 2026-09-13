import { ConflictException, NotFoundException } from '@nestjs/common';
import { InMemoryStudentsRepository } from '../../../../infra/repositories/in-memory-students.repository';
import { StudentsService } from './students.service';

describe('StudentsService', () => {
  let service: StudentsService;

  beforeEach(() => {
    service = new StudentsService(new InMemoryStudentsRepository());
  });

  it('creates and lists students', async () => {
    const student = await service.create({
      name: 'Ana Silva',
      email: 'ana@gym.test',
      phone: '11999999999',
    });

    expect(student.id).toBeDefined();
    expect(student.status).toBe('active');
    await expect(service.findAll()).resolves.toEqual([student]);
  });

  it('updates a student', async () => {
    const student = await service.create({
      name: 'Ana Silva',
      email: 'ana@gym.test',
      phone: '11999999999',
    });

    const updatedStudent = await service.update(student.id, {
      phone: '11888888888',
    });

    expect(updatedStudent.phone).toBe('11888888888');
    expect(updatedStudent.name).toBe('Ana Silva');
    expect(updatedStudent.email).toBe('ana@gym.test');
    expect(updatedStudent.updatedAt).toEqual(expect.any(String));
  });

  it('removes a student', async () => {
    const student = await service.create({
      name: 'Ana Silva',
      email: 'ana@gym.test',
      phone: '11999999999',
    });

    await service.remove(student.id);

    await expect(service.findOne(student.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('does not allow duplicated emails', async () => {
    await service.create({
      name: 'Ana Silva',
      email: 'ana@gym.test',
      phone: '11999999999',
    });

    await expect(
      service.create({
        name: 'Bruno Souza',
        email: 'ana@gym.test',
        phone: '11888888888',
      }),
    ).rejects.toThrow(ConflictException);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from './../src/app.module';

interface StudentResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate?: string;
  enrollmentDate: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer()).get('/api').expect(200).expect({
      status: 'ok',
      service: 'gym-management-api',
    });
  });

  it('/api/students (CRUD)', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/students')
      .send({
        name: 'Ana Silva',
        email: 'ana@gym.test',
        phone: '11999999999',
        birthDate: '1998-04-12',
      })
      .expect(201);

    const createdStudent = createResponse.body as StudentResponse;

    expect(createdStudent).toMatchObject({
      name: 'Ana Silva',
      email: 'ana@gym.test',
      phone: '11999999999',
      birthDate: '1998-04-12',
      status: 'active',
    });
    expect(createdStudent.enrollmentDate).toEqual(expect.any(String));
    expect(createdStudent.id).toEqual(expect.any(String));

    const studentId = createdStudent.id;

    const listResponse = await request(app.getHttpServer())
      .get('/api/students')
      .expect(200);

    const students = listResponse.body as StudentResponse[];
    expect(students).toHaveLength(1);
    expect(students[0].id).toBe(studentId);

    const findResponse = await request(app.getHttpServer())
      .get(`/api/students/${studentId}`)
      .expect(200);

    const foundStudent = findResponse.body as StudentResponse;
    expect(foundStudent.email).toBe('ana@gym.test');

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/students/${studentId}`)
      .send({ phone: '11888888888', status: 'inactive' })
      .expect(200);

    const updatedStudent = updateResponse.body as StudentResponse;
    expect(updatedStudent.name).toBe('Ana Silva');
    expect(updatedStudent.email).toBe('ana@gym.test');
    expect(updatedStudent.phone).toBe('11888888888');
    expect(updatedStudent.status).toBe('inactive');

    await request(app.getHttpServer())
      .delete(`/api/students/${studentId}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/students/${studentId}`)
      .expect(404);
  });

  it('/api/students (POST) validates payloads', () => {
    return request(app.getHttpServer())
      .post('/api/students')
      .send({
        name: '',
        email: 'invalid-email',
        phone: '11999999999',
        unknownField: true,
      })
      .expect(400);
  });
});

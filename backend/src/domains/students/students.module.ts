import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentOrmEntity } from '../../infra/database/typeorm/entities/student.orm-entity';
import { TypeOrmStudentsRepository } from '../../infra/repositories/typeorm-students.repository';
import { StudentsService } from './application/services/students.service';
import { STUDENTS_REPOSITORY } from './domain/repositories/students.repository';
import { StudentsController } from './presentation/http/students.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StudentOrmEntity])],
  controllers: [StudentsController],
  providers: [
    StudentsService,
    {
      provide: STUDENTS_REPOSITORY,
      useClass: TypeOrmStudentsRepository,
    },
  ],
})
export class StudentsModule {}

import { Column, Entity, PrimaryColumn } from 'typeorm';
import { StudentStatus } from '../../../../domains/students/domain/entities/student.entity';

@Entity('students')
export class StudentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 160, unique: true })
  email: string;

  @Column({ length: 30 })
  phone: string;

  @Column({ name: 'birth_date', nullable: true, type: 'date' })
  birthDate?: string;

  @Column({ name: 'enrollment_date', type: 'date' })
  enrollmentDate: string;

  @Column({
    enum: StudentStatus,
    enumName: 'student_status',
    type: 'enum',
  })
  status: StudentStatus;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: string;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: string;
}

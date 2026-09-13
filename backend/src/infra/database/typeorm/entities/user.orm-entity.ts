import { Column, Entity, PrimaryColumn } from 'typeorm';
import {
  UserRole,
  UserStatus,
} from '../../../../domains/users/domain/entities/user.entity';

@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 160, unique: true })
  email: string;

  @Column({ length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ length: 30, nullable: true })
  phone?: string;

  @Column({
    enum: UserRole,
    enumName: 'user_role',
    type: 'enum',
  })
  role: UserRole;

  @Column({
    enum: UserStatus,
    enumName: 'user_status',
    type: 'enum',
  })
  status: UserStatus;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: string;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: string;
}

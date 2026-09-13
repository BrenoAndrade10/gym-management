import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domains/users/domain/entities/user.entity';
import { UsersRepository } from '../../domains/users/domain/repositories/users.repository';
import { UserOrmEntity } from '../database/typeorm/entities/user.orm-entity';

@Injectable()
export class TypeOrmUsersRepository implements UsersRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async create(user: User) {
    const userEntity = this.repository.create(user);
    const savedUser = await this.repository.save(userEntity);

    return this.toDomain(savedUser);
  }

  async findAll() {
    const users = await this.repository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return users.map((user) => this.toDomain(user));
  }

  async findById(id: string) {
    const user = await this.repository.findOneBy({ id });

    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string) {
    const user = await this.repository.findOneBy({ email });

    return user ? this.toDomain(user) : null;
  }

  async save(user: User) {
    const userEntity = this.repository.create(user);
    const savedUser = await this.repository.save(userEntity);

    return this.toDomain(savedUser);
  }

  async delete(id: string) {
    await this.repository.delete(id);
  }

  private toDomain(user: UserOrmEntity): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

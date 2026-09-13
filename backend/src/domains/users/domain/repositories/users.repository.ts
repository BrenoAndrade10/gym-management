import { User } from '../entities/user.entity';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export abstract class UsersRepository {
  abstract create(user: User): Promise<User>;
  abstract findAll(): Promise<User[]>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract save(user: User): Promise<User>;
  abstract delete(id: string): Promise<void>;
}

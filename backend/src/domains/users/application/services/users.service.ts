import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { User, UserRole, UserStatus } from '../../domain/entities/user.entity';
import {
  USERS_REPOSITORY,
  UsersRepository,
} from '../../domain/repositories/users.repository';
import { LoginUserDto } from '../dto/login-user.dto';
import { RegisterUserDto } from '../dto/register-user.dto';

const scryptAsync = promisify(scrypt);

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    if (registerUserDto.password !== registerUserDto.confirmPassword) {
      throw new BadRequestException('As senhas informadas nao conferem');
    }

    const existingUser = await this.usersRepository.findByEmail(
      registerUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException(
        `Ja existe um professor cadastrado com o email "${registerUserDto.email}"`,
      );
    }

    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      name: registerUserDto.name,
      email: registerUserDto.email,
      phone: registerUserDto.phone,
      passwordHash: await this.hashPassword(registerUserDto.password),
      role: UserRole.Teacher,
      status: UserStatus.Active,
      createdAt: now,
      updatedAt: now,
    };

    const createdUser = await this.usersRepository.create(user);

    return this.toAuthenticatedUser(createdUser);
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.usersRepository.findByEmail(loginUserDto.email);

    if (!user || user.status !== UserStatus.Active) {
      throw new UnauthorizedException('Email ou senha invalidos');
    }

    const isPasswordValid = await this.verifyPassword(
      loginUserDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou senha invalidos');
    }

    return this.toAuthenticatedUser(user);
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scryptAsync(password, salt, 64)) as Buffer;

    return `${salt}:${hash.toString('hex')}`;
  }

  private async verifyPassword(password: string, storedPassword: string) {
    const [salt, storedHash] = storedPassword.split(':');

    if (!salt || !storedHash) {
      return false;
    }

    const hash = (await scryptAsync(password, salt, 64)) as Buffer;
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    if (hash.length !== storedHashBuffer.length) {
      return false;
    }

    return timingSafeEqual(hash, storedHashBuffer);
  }

  private toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    };
  }
}

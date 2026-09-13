import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from '../../infra/database/typeorm/entities/user.orm-entity';
import { TypeOrmUsersRepository } from '../../infra/repositories/typeorm-users.repository';
import { UsersService } from './application/services/users.service';
import { USERS_REPOSITORY } from './domain/repositories/users.repository';
import { AuthController } from './presentation/http/auth.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [AuthController],
  providers: [
    UsersService,
    {
      provide: USERS_REPOSITORY,
      useClass: TypeOrmUsersRepository,
    },
  ],
  exports: [USERS_REPOSITORY, UsersService],
})
export class UsersModule {}

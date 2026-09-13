import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentOrmEntity } from './typeorm/entities/student.orm-entity';
import { UserOrmEntity } from './typeorm/entities/user.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.getOrThrow<string>('DATABASE_URL'),
        entities: [StudentOrmEntity, UserOrmEntity],
        synchronize:
          configService.get<string>('TYPEORM_SYNCHRONIZE') === 'true',
        ssl: {
          rejectUnauthorized: false,
        },
      }),
    }),
  ],
})
export class DatabaseModule {}

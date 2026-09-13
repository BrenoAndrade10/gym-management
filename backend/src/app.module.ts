import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StudentsModule } from './domains/students/students.module';
import { UsersModule } from './domains/users/users.module';
import { InfraModule } from './infra/infra.module';

@Module({
  imports: [InfraModule, StudentsModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

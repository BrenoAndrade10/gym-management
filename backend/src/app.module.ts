import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StudentsModule } from './domains/students/students.module';
import { UsersModule } from './domains/users/users.module';
import { WorkoutsModule } from './domains/workouts/workouts.module';
import { InfraModule } from './infra/infra.module';

@Module({
  imports: [InfraModule, StudentsModule, UsersModule, WorkoutsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

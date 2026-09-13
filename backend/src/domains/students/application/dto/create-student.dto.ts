import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { StudentStatus } from '../../domain/entities/student.entity';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsEmail()
  @MaxLength(160)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;

  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}

import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { StudentStatus } from '../../domain/entities/student.entity';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

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

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsEmail()
  @MaxLength(160)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  confirmPassword: string;
}

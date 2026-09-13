import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginUserDto } from '../../application/dto/login-user.dto';
import { RegisterUserDto } from '../../application/dto/register-user.dto';
import { UsersService } from '../../application/services/users.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.usersService.register(registerUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginUserDto: LoginUserDto) {
    return this.usersService.login(loginUserDto);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateWorkoutDto } from '../../application/dto/create-workout.dto';
import { UpdateWorkoutDto } from '../../application/dto/update-workout.dto';
import { CreateWorkoutExecutionDto } from '../../application/dto/create-workout-execution.dto';
import { WorkoutsService } from '../../application/services/workouts.service';

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createWorkoutDto: CreateWorkoutDto) {
    return this.workoutsService.create(createWorkoutDto);
  }

  @Get()
  findAll(@Query('studentId') studentId?: string) {
    return this.workoutsService.findAll(studentId);
  }

  @Get('executions/history')
  findExecutionHistory(@Query('studentId') studentId?: string) {
    return this.workoutsService.findExecutionHistory(studentId);
  }

  @Post(':id/executions')
  @HttpCode(HttpStatus.CREATED)
  recordExecution(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWorkoutExecutionDto,
  ) {
    return this.workoutsService.recordExecution(id, dto);
  }

  @Get(':id/executions')
  findWorkoutExecutionHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.workoutsService.findWorkoutExecutionHistory(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workoutsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkoutDto: UpdateWorkoutDto,
  ) {
    return this.workoutsService.update(id, updateWorkoutDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.workoutsService.remove(id);
  }
}

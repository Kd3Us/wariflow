import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProjectManagementService } from './project-management.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { TokenAuthGuard } from '../common/guards/token-auth.guard';
import { ProjectManagementStage } from './entities/project-management-task.entity';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('project-management')
@Controller('project-management')
@UseGuards(TokenAuthGuard)
export class ProjectManagementController {
  constructor(private readonly projectManagementService: ProjectManagementService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.projectManagementService.create(createTaskDto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    if (projectId) {
      return this.projectManagementService.findByProject(projectId);
    }
    return this.projectManagementService.findAll();
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectManagementService.findByProject(projectId);
  }

  @Get('project/:projectId/stage/:stage')
  findByProjectAndStage(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('stage') stage: ProjectManagementStage,
  ) {
    return this.projectManagementService.getTasksByStage(projectId, stage);
  }

  @Get('project/:projectId/statistics')
  getStatistics(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectManagementService.getTaskStatistics(projectId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectManagementService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.projectManagementService.update(id, updateTaskDto);
  }

  @Patch(':id/stage')
  updateStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStageDto: UpdateStageDto,
  ) {
    return this.projectManagementService.updateStage(id, updateStageDto);
  }

  @Post(':id/assign')
  assignUsers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('userIds') userIds: string[],
  ) {
    return this.projectManagementService.assignUsers(id, userIds);
  }

  @Delete(':id/assign/:userId')
  removeUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId') userId: string,
  ) {
    return this.projectManagementService.removeUser(id, userId);
  }

  @Post(':id/referents')
  assignReferents(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('referentIds') referentIds: string[],
  ) {
    return this.projectManagementService.assignReferents(id, referentIds);
  }

  @Delete(':id/referents/:referentId')
  removeReferent(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('referentId') referentId: string,
  ) {
    return this.projectManagementService.removeReferent(id, referentId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectManagementService.remove(id);
  }
}

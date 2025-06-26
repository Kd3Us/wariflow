import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsUUID, IsDateString, Min, Max, IsObject } from 'class-validator';
import { ProjectManagementStage, TaskPriority } from '../entities/project-management-task.entity';
import { TeamMember } from '../../teams/entities/team-member.entity';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectManagementStage)
  stage?: ProjectManagementStage;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualHours?: number;

  @IsOptional()
  @IsArray()
  assignedTo?: (TeamMember | string)[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  comments?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  attachments?: number;
}

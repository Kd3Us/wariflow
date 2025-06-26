import { IsEnum } from 'class-validator';
import { ProjectManagementStage } from '../entities/project-management-task.entity';

export class UpdateStageDto {
  @IsEnum(ProjectManagementStage)
  stage: ProjectManagementStage;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ProjectStage } from '../../common/enums/project-stage.enum';

export class UpdateStageDto {
  @ApiProperty({ enum: ProjectStage, description: 'Nouvelle étape du projet' })
  @IsEnum(ProjectStage)
  @IsNotEmpty()
  stage: ProjectStage;
}
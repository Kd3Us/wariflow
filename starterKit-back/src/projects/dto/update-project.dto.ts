import { IsString, IsEnum, IsOptional, IsInt, Min, Max, IsArray, IsDateString, IsBoolean } from 'class-validator';
import { ProjectStage } from '../../common/enums/project-stage.enum';

export class UpdateSubStepDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStage)
  stage?: ProjectStage;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teamIds?: string[];

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  subSteps?: UpdateSubStepDto[];

  @IsOptional()
  @IsDateString()
  reminderDate?: string;
}
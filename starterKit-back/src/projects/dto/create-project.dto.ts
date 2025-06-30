import { IsString, IsEnum, IsOptional, IsInt, Min, Max, IsArray, IsDateString, IsBoolean } from 'class-validator';
import { ProjectStage } from '../../common/enums/project-stage.enum';

export class CreateSubStepDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(ProjectStage)
  stage?: ProjectStage = ProjectStage.IDEE;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number = 0;

  @IsDateString()
  deadline: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teamIds?: string[] = [];

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] = [];

  @IsString()
  organisation: string;

  @IsOptional()
  @IsArray()
  subSteps?: CreateSubStepDto[] = [];

  @IsOptional()
  @IsDateString()
  reminderDate?: string;
}
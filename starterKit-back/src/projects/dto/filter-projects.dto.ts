import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsBoolean, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ProjectStage } from '../../common/enums/project-stage.enum';

export class FilterProjectsDto {
  @ApiProperty({ enum: ProjectStage, required: false, description: 'Filtrer par étape' })
  @IsOptional()
  @IsEnum(ProjectStage)
  stage?: ProjectStage;

  @ApiProperty({ required: false, description: 'Filtrer par priorité' })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({ required: false, description: 'Recherche par titre ou description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Filtrer les projets avec deadline proche (en jours)' })
  @IsOptional()
  @Type(() => Number)
  deadlineInDays?: number;

  @ApiProperty({ required: false, description: 'Filtrer les projets avec rappels actifs' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hasActiveReminder?: boolean;

  @ApiProperty({ required: false, description: 'Trier par (createdAt, deadline, progress)' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ required: false, description: 'Ordre de tri (asc, desc)' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
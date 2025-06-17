import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsNumber, IsDate, IsOptional, IsArray, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStage } from '../../common/enums/project-stage.enum';

export class UserInstructionDto {
  @ApiProperty({ description: 'ID de l\'instruction' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Titre de l\'instruction' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description de l\'instruction' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Priorité de l\'instruction', enum: ['LOW', 'MEDIUM', 'HIGH'] })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  priority: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({ description: 'Date d\'échéance de l\'instruction', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @ApiProperty({ description: 'Statut de completion', default: false })
  completed: boolean;

  @ApiProperty({ description: 'Date de création' })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;
}

export class CreateProjectDto {
  @ApiProperty({ description: 'Titre du projet' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description du projet' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ProjectStage, description: 'Étape du projet' })
  @IsEnum(ProjectStage)
  stage: ProjectStage;

  @ApiProperty({ description: 'Progression du projet (0-100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  @ApiProperty({ description: 'Date limite du projet' })
  @IsDate()
  @Type(() => Date)
  deadline: Date;

  @ApiProperty({ description: 'IDs des membres de l\'équipe', type: [String] })
  @IsArray()
  @IsString({ each: true })
  teamIds: string[];

  @ApiProperty({ description: 'Priorité du projet', enum: ['LOW', 'MEDIUM', 'HIGH'], required: false })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({ description: 'Tags du projet', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Date de rappel', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  reminderDate?: Date;

  @ApiProperty({ description: 'Instructions du projet', type: [UserInstructionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserInstructionDto)
  instructions?: UserInstructionDto[];
}
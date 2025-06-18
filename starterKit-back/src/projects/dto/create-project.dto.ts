import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsNumber, IsDate, IsOptional, IsArray, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStage } from '../../common/enums/project-stage.enum';
import { UserInstructionDto } from './user-instruction.dto';

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ProjectStage })
  @IsEnum(ProjectStage)
  stage: ProjectStage;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  deadline: Date;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  teamIds: string[];

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'], required: false })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  reminderDate?: Date;

  @ApiProperty({ type: [UserInstructionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserInstructionDto)
  instructions?: UserInstructionDto[];
}
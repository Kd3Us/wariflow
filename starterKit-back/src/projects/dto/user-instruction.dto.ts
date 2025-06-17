import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UserInstructionDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  priority: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @ApiProperty()
  @IsBoolean()
  completed: boolean;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;
}
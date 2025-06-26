import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AddUsersToProjectDto {
  @ApiProperty({
    description: 'Liste des IDs des utilisateurs à ajouter au projet',
    example: ['user-id-1', 'user-id-2'],
    type: [String]
  })
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  userIds: string[];
}
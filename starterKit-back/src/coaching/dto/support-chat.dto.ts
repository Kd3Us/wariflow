import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type SenderType = 'user' | 'coach' | 'bot';
export type MessageType = 'text' | 'file' | 'system';

export class CreateTicketDto {
  @ApiProperty({ description: 'ID de l\'utilisateur' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Titre du ticket' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Description du problème' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Catégorie du ticket' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'urgent'] })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @ApiPropertyOptional({ description: 'Message initial' })
  @IsOptional()
  @IsString()
  initialMessage?: string;
}

export class UpdateTicketDto {
  @ApiPropertyOptional({ description: 'Titre du ticket' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Description du problème' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['open', 'assigned', 'in_progress', 'resolved', 'closed'] })
  @IsOptional()
  @IsEnum(['open', 'assigned', 'in_progress', 'resolved', 'closed'])
  status?: string;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'urgent'] })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @ApiPropertyOptional({ description: 'ID du coach assigné' })
  @IsOptional()
  @IsString()
  coachId?: string;

  // AJOUT : Propriété manquante pour updatedAt
  @ApiPropertyOptional({ description: 'Date de mise à jour' })
  @IsOptional()
  @IsDate()
  updatedAt?: Date;
}

export class SendMessageDto {
  @ApiProperty({ description: 'ID du ticket' })
  @IsString()
  ticketId: string;

  @ApiProperty({ description: 'ID de l\'expéditeur' })
  @IsString()
  senderId: string;

  @ApiPropertyOptional({ enum: ['user', 'coach', 'bot'] })
  @IsOptional()
  @IsEnum(['user', 'coach', 'bot'])
  senderType?: string;

  @ApiProperty({ description: 'Contenu du message' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ enum: ['text', 'file', 'system'] })
  @IsOptional()
  @IsEnum(['text', 'file', 'system'])
  messageType?: string;

  // AJOUT : Propriété manquante pour isRead
  @ApiPropertyOptional({ description: 'Message lu', default: false })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
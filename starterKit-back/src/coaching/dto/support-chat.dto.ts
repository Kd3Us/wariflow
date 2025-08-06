import { IsNotEmpty, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TicketStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  SYSTEM = 'system'
}

export enum SenderType {
  USER = 'user',
  COACH = 'coach',
  BOT = 'bot'
}

export class CreateTicketDto {
  @ApiProperty({ description: 'ID de l\'utilisateur' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Titre du ticket' })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  title: string;

  @ApiProperty({ description: 'Description du problème' })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ description: 'Catégorie du ticket' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ description: 'Priorité du ticket', enum: TicketPriority })
  @IsEnum(TicketPriority)
  priority: TicketPriority;
}

export class UpdateTicketDto {
  @ApiProperty({ description: 'Titre du ticket', required: false })
  @IsOptional()
  @IsString()
  @MinLength(5)
  title?: string;

  @ApiProperty({ description: 'Description du ticket', required: false })
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiProperty({ description: 'Statut du ticket', enum: TicketStatus, required: false })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiProperty({ description: 'Priorité du ticket', enum: TicketPriority, required: false })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiProperty({ description: 'ID du coach assigné', required: false })
  @IsOptional()
  @IsString()
  coachId?: string;
}

export class SendMessageDto {
  @ApiProperty({ description: 'ID de l\'expéditeur' })
  @IsNotEmpty()
  @IsString()
  senderId: string;

  @ApiProperty({ description: 'Type d\'expéditeur', enum: SenderType })
  @IsEnum(SenderType)
  senderType: SenderType;

  @ApiProperty({ description: 'Contenu du message' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ description: 'Type de message', enum: MessageType })
  @IsEnum(MessageType)
  messageType: MessageType;

  @ApiProperty({ description: 'Message lu', required: false })
  @IsOptional()
  isRead?: boolean;
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Coach } from './coach.entity';

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  coachId: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ['open', 'assigned', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  })
  status: string;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  })
  priority: string;

  @Column()
  category: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ChatMessage, message => message.ticket)
  messages: ChatMessage[];

  @ManyToOne(() => Coach, { nullable: true })
  @JoinColumn({ name: 'coachId' })
  coach: Coach;
}

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticketId: string;

  @Column()
  senderId: string;

  @Column({
    type: 'enum',
    enum: ['user', 'coach', 'bot']
  })
  senderType: string;

  @Column('text')
  content: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ default: false })
  isRead: boolean;

  @Column({
    type: 'enum',
    enum: ['text', 'file', 'system'],
    default: 'text'
  })
  messageType: string;

  @ManyToOne(() => SupportTicket, ticket => ticket.messages)
  @JoinColumn({ name: 'ticketId' })
  ticket: SupportTicket;
}
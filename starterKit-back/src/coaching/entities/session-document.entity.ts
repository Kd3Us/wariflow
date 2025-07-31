import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { SessionHistory } from './session-history.entity';

@Entity('session_documents')
export class SessionDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionHistoryId: string;

  @ManyToOne(() => SessionHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionHistoryId' })
  sessionHistory: SessionHistory;

  @Column()
  name: string;

  @Column()
  originalName: string;

  @Column()
  url: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ 
    type: 'enum', 
    enum: ['presentation', 'document', 'image', 'video', 'audio', 'other'],
    default: 'document'
  })
  type: string;

  @Column()
  uploadedBy: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  uploadDate: Date;
}
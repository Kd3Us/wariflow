import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SessionHistory } from './session-history.entity';

@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionHistoryId: string;

  @ManyToOne(() => SessionHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionHistoryId' })
  sessionHistory: SessionHistory;

  @Column()
  userId: string;

  @Column()
  coachId: string;

  @Column({ type: 'integer' })
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'json', nullable: true })
  categories: {
    communication: number;
    expertise: number;
    helpfulness: number;
    clarity: number;
    preparation: number;
  };

  @Column({ type: 'text', array: true, default: '{}' })
  positiveAspects: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  improvementAreas: string[];

  @Column({ type: 'boolean', default: false })
  wouldRecommend: boolean;

  @Column({ type: 'text', nullable: true })
  coachResponse: string;

  @Column({ type: 'timestamp', nullable: true })
  coachResponseDate: Date;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
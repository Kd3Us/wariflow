import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SessionHistory } from './session-history.entity';

@Entity('progress_trackings')
export class ProgressTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  sessionHistoryId: string;

  @ManyToOne(() => SessionHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionHistoryId' })
  sessionHistory: SessionHistory;

  @Column()
  skillName: string;

  @Column({ type: 'integer', default: 0 })
  previousLevel: number;

  @Column({ type: 'integer', default: 0 })
  currentLevel: number;

  @Column({ type: 'integer', default: 0 })
  targetLevel: number;

  @Column({ type: 'text', array: true, default: '{}' })
  achievements: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  challengesIdentified: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  actionItems: string[];

  @Column({ type: 'date', nullable: true })
  nextMilestoneDate: Date;

  @Column({ type: 'text', nullable: true })
  coachNotes: string;

  @Column({ type: 'json', nullable: true })
  metrics: {
    confidenceLevel: number;
    practiceHours: number;
    applicationSuccess: number;
    peerFeedback: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
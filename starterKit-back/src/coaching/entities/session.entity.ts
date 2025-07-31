import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Coach } from './coach.entity';
import { SessionHistory } from './session-history.entity';

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  coachId: string;

  @Column()
  userId: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'int' })
  duration: number;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.SCHEDULED
  })
  status: SessionStatus;

  @Column()
  topic: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ type: 'int', nullable: true })
  rating: number;

  @Column('text', { nullable: true })
  feedback: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Coach, coach => coach.sessions)
  @JoinColumn({ name: 'coachId' })
  coach: Coach;

  @OneToOne(() => SessionHistory, sessionHistory => sessionHistory.sessionId, { cascade: true })
  sessionHistory: SessionHistory;
}
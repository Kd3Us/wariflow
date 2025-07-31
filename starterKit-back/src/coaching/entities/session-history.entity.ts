import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('session_histories')
export class SessionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  coachId: string;

  @Column()
  userId: string;

  @Column()
  coachName: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'integer' })
  duration: number;

  @Column()
  topic: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', array: true, default: '{}' })
  objectives: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  outcomes: string[];

  @Column({ type: 'integer', nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ type: 'text', array: true, default: '{}' })
  nextSteps: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'json', nullable: true })
  progress: {
    goalsAchieved: number;
    totalGoals: number;
    skillsImproved: string[];
    nextFocusAreas: string[];
  };

  @Column({ type: 'json', nullable: true })
  documents: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    uploadDate: Date;
  }>;

  @Column({ 
    type: 'enum', 
    enum: ['completed', 'cancelled', 'no-show'],
    default: 'completed'
  })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
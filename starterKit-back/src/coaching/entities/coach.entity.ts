import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Session } from './session.entity';
import { Review } from './review.entity';
import { Availability } from './availability.entity';

@Entity('coaches')
export class Coach {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  avatar: string;

  @Column('simple-array')
  specialties: string[];

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewsCount: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  hourlyRate: number;

  @Column('text')
  bio: string;

  @Column({ type: 'int' })
  experience: number;

  @Column('simple-array')
  certifications: string[];

  @Column('simple-array')
  languages: string[];

  @Column()
  timezone: string;

  @Column({ type: 'boolean', default: false })
  isOnline: boolean;

  @Column()
  responseTime: string;

  @Column({ type: 'timestamp', nullable: true })
  nextAvailableSlot: Date;

  @Column({ type: 'int', default: 0 })
  totalSessions: number;

  @Column({ type: 'int', default: 0 })
  successRate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Session, session => session.coach)
  sessions: Session[];

  @OneToMany(() => Review, review => review.coach)
  reviews: Review[];

  @OneToMany(() => Availability, availability => availability.coach)
  availabilities: Availability[];
}
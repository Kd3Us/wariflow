import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Coach } from './coach.entity';

@Entity('availabilities')
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  coachId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'boolean', default: false })
  isBooked: boolean;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  price: number;

  @ManyToOne(() => Coach, coach => coach.availabilities)
  @JoinColumn({ name: 'coachId' })
  coach: Coach;
}
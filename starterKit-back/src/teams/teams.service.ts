import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { TeamMember } from '../common/interfaces/team-member.interface';

@Injectable()
export class TeamsService {
  private teamMembers: TeamMember[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    this.teamMembers = [
      {
        id: uuidv4(),
        name: 'Alice Martin',
        email: 'alice.martin@example.com',
        role: 'Product Manager',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
      },
      {
        id: uuidv4(),
        name: 'Thomas Dubois',
        email: 'thomas.dubois@example.com',
        role: 'Frontend Developer',
        avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
      },
      {
        id: uuidv4(),
        name: 'Sophie Leclerc',
        email: 'sophie.leclerc@example.com',
        role: 'UX Designer',
        avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
      },
      {
        id: uuidv4(),
        name: 'Marc Rousseau',
        email: 'marc.rousseau@example.com',
        role: 'Backend Developer',
        avatar: 'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
      },
      {
        id: uuidv4(),
        name: 'Emma Bernard',
        email: 'emma.bernard@example.com',
        role: 'Data Analyst',
        avatar: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
      }
    ];
  }

  findAll(): TeamMember[] {
    return this.teamMembers;
  }

  findOne(id: string): TeamMember | undefined {
    return this.teamMembers.find(member => member.id === id);
  }

  findByIds(ids: string[]): TeamMember[] {
    return this.teamMembers.filter(member => ids.includes(member.id));
  }
}
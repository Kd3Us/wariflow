export interface UserInstruction {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: Date;
  completed: boolean;
  createdAt: Date;
}
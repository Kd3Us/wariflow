export interface AIGenerateRequest {
  description: string;
  context?: string;
  targetAudience?: string;
  maxTasks?: number;
  includeAnalysis?: boolean;
  taskGeneration?: boolean;
  projectId?: string;
}

export interface AIAnalysisResponse {
  success: boolean;
  message: string;
  projects: any[];
  analysis: {
    project_classification?: {
      project_type: string;
    };
    project_tasks?: {
      ml_generated_tasks: AITask[];
    };
  };
  suggestions: string[];
}

export interface AITask {
  name: string;
  title?: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedHours?: number;
  tags?: string[];
  deadline?: string;
}

export interface AIHealthResponse {
  status: string;
  timestamp: string;
}
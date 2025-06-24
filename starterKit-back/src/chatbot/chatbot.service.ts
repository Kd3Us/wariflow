import { Injectable, BadRequestException } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service';
import { GenerateProjectDto } from './dto/generate-project.dto';
import { ChatbotResponseDto, ProjectAnalysis, ProjectTask } from './dto/chatbot-response.dto';
import { CreateProjectDto } from '../projects/dto/create-project.dto';
import { ProjectStage } from '../common/enums/project-stage.enum';

@Injectable()
export class ChatbotService {
  private readonly techKeywords = [
    'api', 'frontend', 'backend', 'mobile', 'web', 'database', 'ui', 'ux', 
    'design', 'android', 'ios', 'react', 'angular', 'vue', 'node', 'java',
    'python', 'authentification', 'paiement', 'notification', 'chat', 
    'search', 'analytics', 'admin', 'dashboard', 'cms'
  ];

  private readonly businessKeywords = [
    'vente', 'marketing', 'client', 'utilisateur', 'business', 'revenue', 
    'profit', 'ecommerce', 'boutique', 'magasin', 'livraison', 'commande',
    'facture', 'devis', 'crm', 'erp', 'gestion', 'stock', 'inventaire'
  ];

  private readonly urgencyKeywords = [
    'urgent', 'priorité', 'important', 'critique', 'immédiat', 'asap',
    'rapidement', 'vite', 'deadline', 'échéance', 'délai'
  ];

  constructor(private readonly projectsService: ProjectsService) {}

  async generateProject(generateProjectDto: GenerateProjectDto): Promise<ChatbotResponseDto> {
    const analysis = this.analyzeProjectDescription(generateProjectDto);
    
    if (!this.isValidProject(generateProjectDto.description)) {
      throw new BadRequestException(
        'La description fournie est trop courte ou ne contient pas assez d\'informations pour générer un projet'
      );
    }

    const projectsToCreate = this.createProjectCards(analysis, generateProjectDto);
    const createdProjects = [];

    for (const projectData of projectsToCreate) {
      const createdProject = this.projectsService.create(projectData);
      createdProjects.push(createdProject);
    }

    return {
      success: true,
      message: `${createdProjects.length} projet(s) généré(s) avec succès à partir de votre description`,
      projects: createdProjects,
      analysis: analysis,
      suggestions: this.generateOptimizationSuggestions(analysis)
    };
  }

  analyzeProjectDescription(generateProjectDto: GenerateProjectDto): ProjectAnalysis {
    const { description, context, targetAudience } = generateProjectDto;
    const fullText = `${description} ${context || ''} ${targetAudience || ''}`;
    
    const keywords = this.extractKeywords(fullText);
    const projectType = this.identifyProjectType(fullText, keywords);
    const complexity = this.estimateComplexity(fullText, keywords);
    const estimatedDuration = this.calculateDuration(complexity, keywords.length);
    const suggestedTags = this.generateTags(keywords, projectType);
    const suggestedPriority = this.determinePriority(fullText);
    const breakdown = this.generateTaskBreakdown(projectType, complexity, keywords);

    return {
      projectType,
      complexity,
      keywords,
      estimatedDuration,
      suggestedTags,
      suggestedPriority,
      breakdown
    };
  }

  private isValidProject(description: string): boolean {
    const wordCount = description.trim().split(/\s+/).length;
    const hasRelevantKeywords = this.extractKeywords(description).length > 0;
    
    return description.length >= 20 && wordCount >= 5 && hasRelevantKeywords;
  }

  private extractKeywords(text: string): string[] {
    const normalizedText = text.toLowerCase();
    const foundKeywords = new Set<string>();

    [...this.techKeywords, ...this.businessKeywords].forEach(keyword => {
      if (normalizedText.includes(keyword)) {
        foundKeywords.add(keyword);
      }
    });

    const additionalKeywords = this.extractContextualKeywords(normalizedText);
    additionalKeywords.forEach(keyword => foundKeywords.add(keyword));

    return Array.from(foundKeywords);
  }

  private extractContextualKeywords(text: string): string[] {
    const keywords = [];
    
    if (text.includes('géolocalisation') || text.includes('gps') || text.includes('carte')) {
      keywords.push('géolocalisation');
    }
    if (text.includes('temps réel') || text.includes('live') || text.includes('instantané')) {
      keywords.push('temps-réel');
    }
    if (text.includes('multilingue') || text.includes('langue')) {
      keywords.push('multilingue');
    }
    if (text.includes('responsive') || text.includes('adaptatif')) {
      keywords.push('responsive');
    }
    
    return keywords;
  }

  private identifyProjectType(text: string, keywords: string[]): string {
    const mobileIndicators = ['mobile', 'app', 'android', 'ios', 'smartphone', 'tablette'];
    const webIndicators = ['web', 'site', 'landing', 'page', 'frontend', 'navigateur'];
    const backendIndicators = ['api', 'backend', 'serveur', 'database', 'base de données'];
    const designIndicators = ['design', 'ui', 'ux', 'maquette', 'prototype', 'interface'];
    const ecommerceIndicators = ['boutique', 'ecommerce', 'vente', 'panier', 'commande'];

    if (this.hasIndicators(text, keywords, mobileIndicators)) return 'Application Mobile';
    if (this.hasIndicators(text, keywords, ecommerceIndicators)) return 'E-commerce';
    if (this.hasIndicators(text, keywords, webIndicators)) return 'Application Web';
    if (this.hasIndicators(text, keywords, backendIndicators)) return 'API/Backend';
    if (this.hasIndicators(text, keywords, designIndicators)) return 'Design/UX';
    
    return 'Projet Général';
  }

  private hasIndicators(text: string, keywords: string[], indicators: string[]): boolean {
    const textLower = text.toLowerCase();
    return indicators.some(indicator => 
      textLower.includes(indicator) || keywords.includes(indicator)
    );
  }

  private estimateComplexity(text: string, keywords: string[]): 'simple' | 'moyen' | 'complexe' {
    let complexityScore = 0;
    
    complexityScore += keywords.length;
    complexityScore += Math.floor(text.split(' ').length / 20);
    
    const complexFeatures = [
      'paiement', 'authentification', 'notification', 'analytics', 'chat',
      'géolocalisation', 'temps-réel', 'multilingue', 'admin', 'dashboard'
    ];
    
    const foundComplexFeatures = keywords.filter(k => complexFeatures.includes(k));
    complexityScore += foundComplexFeatures.length * 3;
    
    if (text.includes('intégration') || text.includes('api externe')) {
      complexityScore += 2;
    }
    
    if (complexityScore < 6) return 'simple';
    if (complexityScore < 12) return 'moyen';
    return 'complexe';
  }

  private calculateDuration(complexity: 'simple' | 'moyen' | 'complexe', keywordCount: number): number {
    const baseDuration = {
      'simple': 10,
      'moyen': 25,
      'complexe': 45
    };
    
    const adjustedDuration = baseDuration[complexity] + (keywordCount * 2);
    return Math.min(adjustedDuration, 90);
  }

  private generateTags(keywords: string[], projectType: string): string[] {
    const tags = new Set([
      projectType.toLowerCase().replace(/\s+/g, '-'),
      ...keywords.slice(0, 5)
    ]);
    
    return Array.from(tags);
  }

  private determinePriority(text: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const textLower = text.toLowerCase();
    
    const hasUrgencyKeywords = this.urgencyKeywords.some(keyword => 
      textLower.includes(keyword)
    );
    
    if (hasUrgencyKeywords) return 'HIGH';
    
    const businessKeywordCount = this.businessKeywords.filter(keyword => 
      textLower.includes(keyword)
    ).length;
    
    if (businessKeywordCount >= 3) return 'MEDIUM';
    
    return 'LOW';
  }

  private generateTaskBreakdown(projectType: string, complexity: string, keywords: string[]): ProjectTask[] {
    const tasks: ProjectTask[] = [];
    const multiplier = complexity === 'simple' ? 1 : complexity === 'moyen' ? 1.5 : 2.5;

    tasks.push({
      title: 'Analyse et Conception',
      description: 'Définition des besoins, architecture et spécifications techniques',
      stage: ProjectStage.IDEE,
      estimatedDays: Math.ceil(3 * multiplier)
    });

    if (keywords.includes('design') || keywords.includes('ui') || keywords.includes('ux')) {
      tasks.push({
        title: 'Design et Maquettes',
        description: 'Création des maquettes, design system et prototypes',
        stage: ProjectStage.IDEE,
        estimatedDays: Math.ceil(5 * multiplier)
      });
    }

    if (projectType.includes('Mobile') || projectType.includes('Web')) {
      tasks.push({
        title: 'Développement Frontend',
        description: 'Implémentation de l\'interface utilisateur et interactions',
        stage: ProjectStage.MVP,
        estimatedDays: Math.ceil(8 * multiplier)
      });
    }

    if (keywords.includes('api') || keywords.includes('backend') || keywords.includes('database')) {
      tasks.push({
        title: 'Développement Backend',
        description: 'Création de l\'API, base de données et logique métier',
        stage: ProjectStage.MVP,
        estimatedDays: Math.ceil(6 * multiplier)
      });
    }

    tasks.push({
      title: 'Tests et Intégration',
      description: 'Tests unitaires, tests d\'intégration et corrections',
      stage: ProjectStage.TRACTION,
      estimatedDays: Math.ceil(4 * multiplier)
    });

    tasks.push({
      title: 'Déploiement et Go-Live',
      description: 'Mise en production, configuration serveur et monitoring',
      stage: ProjectStage.TRACTION,
      estimatedDays: Math.ceil(2 * multiplier)
    });

    return tasks;
  }

  private createProjectCards(analysis: ProjectAnalysis, generateProjectDto: GenerateProjectDto): CreateProjectDto[] {
    const projects: CreateProjectDto[] = [];
    const baseDate = new Date();
    let cumulativeDays = 0;

    analysis.breakdown.forEach((task, index) => {
      const deadline = new Date(baseDate);
      deadline.setDate(deadline.getDate() + cumulativeDays + task.estimatedDays);
      
      const reminderDate = new Date(deadline);
      reminderDate.setDate(reminderDate.getDate() - 2);

      projects.push({
        title: task.title,
        description: `${task.description}\n\nProjet original: ${generateProjectDto.description}`,
        stage: task.stage as ProjectStage,
        progress: 0,
        deadline: deadline,
        teamIds: [],
        priority: index === 0 ? analysis.suggestedPriority : 'MEDIUM',
        tags: analysis.suggestedTags,
        reminderDate: reminderDate
      });

      cumulativeDays += task.estimatedDays;
    });

    return projects;
  }

  private generateOptimizationSuggestions(analysis: ProjectAnalysis): string[] {
    const suggestions = [];

    if (analysis.complexity === 'complexe') {
      suggestions.push('Considérez une approche MVP pour livrer une première version plus rapidement');
      suggestions.push('Divisez le projet en phases pour réduire les risques');
    }

    if (analysis.keywords.includes('mobile') && analysis.keywords.includes('web')) {
      suggestions.push('Évaluez l\'opportunité d\'utiliser un framework cross-platform comme React Native');
    }

    if (analysis.keywords.includes('paiement')) {
      suggestions.push('Intégrez une solution de paiement éprouvée comme Stripe ou PayPal');
    }

    if (analysis.estimatedDuration > 60) {
      suggestions.push('Le projet est ambitieux, prévoyez des points de contrôle réguliers');
    }

    if (analysis.suggestedPriority === 'HIGH') {
      suggestions.push('Priorité élevée détectée, assurez-vous d\'avoir les ressources nécessaires');
    }

    return suggestions;
  }
}
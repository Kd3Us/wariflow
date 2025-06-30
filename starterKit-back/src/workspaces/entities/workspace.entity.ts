import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  projectId?: string;

  @Column({ nullable: false })
  userEmail: string;

  @OneToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'projectId' })
  project?: Project;

  @Column({ type: 'int', default: 1 })
  currentStep: number;

  @Column('jsonb', {
    default: {
      nom: '',
      prenom: '',
      sexe: '',
      age: null,
      nationalite: '',
      origine: '',
      description: '',
      parcoursUtilisateur: ''
    }
  })
  personForm: {
    nom: string;
    prenom: string;
    sexe: string;
    age: number | null;
    nationalite: string;
    origine: string;
    description: string;
    parcoursUtilisateur: string;
  };

  @Column('jsonb', {
    nullable: true,
    default: null
  })
  personFormData?: {
    personForms: Array<{
      id: string;
      nom: string;
      prenom: string;
      sexe: string;
      age: number | null;
      nationalite: string;
      origine: string;
      description: string;
      parcoursUtilisateur: string;
      dateCreation: Date;
    }>;
    currentPersonForm: {
      nom: string;
      prenom: string;
      sexe: string;
      age: number | null;
      nationalite: string;
      origine: string;
      description: string;
      parcoursUtilisateur: string;
    };
  };

  @Column('jsonb', {
    default: {
      logoBase64: null,
      logoMimeType: null,
      slogan: '',
      typography: '',
      valeurs: '',
      tonMessage: '',
      experienceUtilisateur: ''
    }
  })
  visualIdentityForm: {
    logoBase64?: string; // Logo en base64
    logoMimeType?: string; // Type MIME du logo (image/png, image/jpeg, etc.)
    slogan: string;
    typography: string;
    valeurs: string;
    tonMessage: string;
    experienceUtilisateur: string;
  };

  @Column('jsonb', {
    default: {
      archetypes: [],
      structureNarrative: '',
      pitch: ''
    }
  })
  storytellingForm: {
    archetypes: string[];
    structureNarrative: string;
    pitch: string;
  };

  @Column('jsonb', {
    default: {
      market: '',
      pricing: ''
    }
  })
  businessModelForm: {
    market: string;
    pricing: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface IStorytellingForm {
  archetypes: string[];
  structureNarrative: string;
  pitch: string;
}

export interface Archetype {
  id: string;
  name: string;
  description: string;
}

export const ARCHETYPES: Archetype[] = [
  { id: 'innocent', name: 'L\'Innocent', description: 'Optimiste, honnête, pur' },
  { id: 'sage', name: 'Le Sage', description: 'Sagesse, connaissance, vérité' },
  { id: 'explorer', name: 'L\'Explorateur', description: 'Liberté, aventure, découverte' },
  { id: 'outlaw', name: 'Le Rebelle', description: 'Révolution, changement, disruption' },
  { id: 'magician', name: 'Le Magicien', description: 'Transformation, vision, innovation' },
  { id: 'hero', name: 'Le Héros', description: 'Courage, détermination, triomphe' },
  { id: 'lover', name: 'L\'Amoureux', description: 'Passion, intimité, engagement' },
  { id: 'jester', name: 'Le Bouffon', description: 'Plaisir, humour, spontanéité' },
  { id: 'everyman', name: 'L\'Homme du Peuple', description: 'Appartenance, réalisme, empathie' },
  { id: 'caregiver', name: 'Le Protecteur', description: 'Service, compassion, générosité' },
  { id: 'ruler', name: 'Le Souverain', description: 'Contrôle, responsabilité, leadership' },
  { id: 'creator', name: 'Le Créateur', description: 'Créativité, imagination, expression artistique' }
];

export const NARRATIVE_STRUCTURES = [
  { id: 'marketing', name: 'Storytelling Marketing', description: 'Structure narrative pour le marketing' },
  { id: 'ux', name: 'Storytelling UX', description: 'Narration centrée sur l\'expérience utilisateur' },
  { id: 'three-acts', name: 'Storytelling à 3 actes', description: 'Structure classique en trois actes' },
  { id: 'hero-journey', name: 'Le Voyage du Héros', description: 'Parcours initiatique du protagoniste' },
  { id: 'problem-solution', name: 'Problème-Solution', description: 'Identification du problème et présentation de la solution' }
];


export class StorytellingForm implements IStorytellingForm {
  constructor() {}
  archetypes : string[] = [];
  structureNarrative = "";
  pitch= "";
}


export interface IPersonForm {
    nom: string;
    prenom: string;
    sexe: string;
    age: number | null;
    nationalite: string;
    origine: string;
    description: string;
    parcoursUtilisateur: string;
  }

export interface IPersonCard extends IPersonForm {
  id: string;
  dateCreation: Date;
}

export class PersonForm implements IPersonForm {

  constructor() {}

  nom: string = "";
  prenom: string = "";
  sexe: string = "";
  age: number | null = 0;
  nationalite: string = "";
  origine: string = "";
  description: string = "";
  parcoursUtilisateur: string = "";
  
}

export class PersonCard implements IPersonCard {
  constructor(personForm: IPersonForm, id?: string) {
    this.id = id || this.generateId();
    this.nom = personForm.nom;
    this.prenom = personForm.prenom;
    this.sexe = personForm.sexe;
    this.age = personForm.age;
    this.nationalite = personForm.nationalite;
    this.origine = personForm.origine;
    this.description = personForm.description;
    this.parcoursUtilisateur = personForm.parcoursUtilisateur;
    this.dateCreation = new Date();
  }

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

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export interface PersonFormData {
  personForms: PersonCard[];
  currentPersonForm: PersonForm;
}

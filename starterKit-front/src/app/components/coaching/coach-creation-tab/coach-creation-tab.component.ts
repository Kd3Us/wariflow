import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { CoachManagementService, CreateCoachDto } from '../../../services/coach-management.service';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-coach-creation-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './coach-creation-tab.component.html',
  styleUrls: ['./coach-creation-tab.component.css']
})
export class CoachCreationTabComponent implements OnInit {
  @Output() coachCreated = new EventEmitter<any>();

  coachForm: FormGroup;
  showCreateForm = false;
  isLoading = false;
  showSuccess = false;
  errorMessage = '';
  coaches: any[] = [];

  availableSpecialties = [
    'Leadership', 'Management', 'Entrepreneuriat', 'Innovation', 
    'Marketing Digital', 'Stratégie', 'Communication', 'Développement Personnel',
    'Gestion de Projet', 'Transition de Carrière', 'Vente', 'Négociation',
    'Finance', 'Ressources Humaines', 'Coaching Agile', 'Product Management'
  ];

  availableLanguages = [
    'Français', 'Anglais', 'Espagnol', 'Allemand', 'Italien', 'Portugais'
  ];

  availableTimezones = [
    'Europe/Paris', 'Europe/London', 'America/New_York', 'Asia/Tokyo'
  ];

  responseTimeOptions = [
    '< 1h', '< 4h', '< 12h', '< 24h', '< 48h', '1 semaine'
  ];

  constructor(
    private fb: FormBuilder,
    private coachManagementService: CoachManagementService
  ) {
    this.coachForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCoaches();
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      avatar: [''],
      specialties: this.fb.array([]),
      hourlyRate: [0, [Validators.required, Validators.min(1)]],
      bio: ['', [Validators.required, Validators.minLength(50)]],
      experience: [0, [Validators.required, Validators.min(0)]],
      certifications: this.fb.array([]),
      languages: this.fb.array([]),
      timezone: ['Europe/Paris', Validators.required],
      responseTime: ['< 24h', Validators.required]
    });
  }

  get specialtiesFormArray(): FormArray {
    return this.coachForm.get('specialties') as FormArray;
  }

  get languagesFormArray(): FormArray {
    return this.coachForm.get('languages') as FormArray;
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.resetForm();
    }
  }

  onSpecialtyChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;
    if (value) {
      this.addSpecialty(value);
      selectElement.value = '';
    }
  }

  onLanguageChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;
    if (value) {
      this.addLanguage(value);
      selectElement.value = '';
    }
  }

  hideCreateForm(): void {
    this.showCreateForm = false;
    this.errorMessage = '';
    this.showSuccess = false;
  }

  loadCoaches(): void {
    this.coachManagementService.getAllCoaches().subscribe({
      next: (coaches) => {
        this.coaches = coaches;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des coachs:', error);
      }
    });
  }

  addSpecialty(specialty: string): void {
    if (specialty && !this.specialtiesFormArray.value.includes(specialty)) {
      this.specialtiesFormArray.push(this.fb.control(specialty));
    }
  }

  removeSpecialty(index: number): void {
    this.specialtiesFormArray.removeAt(index);
  }

  addLanguage(language: string): void {
    if (language && !this.languagesFormArray.value.includes(language)) {
      this.languagesFormArray.push(this.fb.control(language));
    }
  }

  removeLanguage(index: number): void {
    this.languagesFormArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.coachForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData: CreateCoachDto = {
        ...this.coachForm.value,
        specialties: this.specialtiesFormArray.value,
        certifications: [],
        languages: this.languagesFormArray.value
      };

      if (formData.specialties.length === 0) {
        this.errorMessage = 'Veuillez sélectionner au moins une spécialité';
        this.isLoading = false;
        return;
      }

      if (formData.languages.length === 0) {
        this.errorMessage = 'Veuillez sélectionner au moins une langue';
        this.isLoading = false;
        return;
      }

      this.coachManagementService.createCoach(formData).pipe(
        catchError((error) => {
          console.error('Erreur lors de la création du coach:', error);
          this.isLoading = false;
          
          if (error.status === 403) {
            this.errorMessage = 'Accès refusé : droits administrateur requis';
          } else if (error.status === 401) {
            this.errorMessage = 'Token invalide ou expiré';
          } else if (error.status === 409) {
            this.errorMessage = 'Un coach avec cet email existe déjà';
          } else {
            this.errorMessage = 'Erreur lors de la création du coach';
          }
          
          throw error;
        })
      ).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showSuccess = true;
          this.coachCreated.emit(response);
          this.loadCoaches();
          
          setTimeout(() => {
            this.hideCreateForm();
            this.showSuccess = false;
          }, 2000);
        }
      });
    }
  }

  resetForm(): void {
    this.coachForm.reset();
    this.clearFormArrays();
    this.coachForm.patchValue({
      timezone: 'Europe/Paris',
      responseTime: '< 24h'
    });
    this.errorMessage = '';
  }

  clearFormArrays(): void {
    while (this.specialtiesFormArray.length !== 0) {
      this.specialtiesFormArray.removeAt(0);
    }
    while (this.languagesFormArray.length !== 0) {
      this.languagesFormArray.removeAt(0);
    }
  }
}
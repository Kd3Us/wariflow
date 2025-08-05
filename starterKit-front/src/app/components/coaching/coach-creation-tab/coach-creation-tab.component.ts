import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
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
  @Output() coachDeleted = new EventEmitter<any>();
  @Input() coaches: any[] = [];

  coachForm: FormGroup;
  showCreateForm = false;
  isLoading = false;
  showSuccess = false;
  errorMessage = '';

  selectedAvatarFile: File | null = null;
  selectedAvatarName = '';
  currentAvatarBase64 = '';
  currentAvatarMimeType = '';
  isProcessingAvatar = false;

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

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximale : 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide');
        return;
      }

      this.selectedAvatarName = file.name;
      this.selectedAvatarFile = file;
      
      this.convertToBase64(file);
    }
  }

  private convertToBase64(file: File): void {
    this.isProcessingAvatar = true;
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      
      this.currentAvatarBase64 = base64Data;
      this.currentAvatarMimeType = file.type;
      this.isProcessingAvatar = false;
    };
    
    reader.onerror = () => {
      this.isProcessingAvatar = false;
      alert('Erreur lors de la lecture du fichier');
    };
    
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.currentAvatarBase64 = '';
    this.currentAvatarMimeType = '';
    this.selectedAvatarName = '';
    this.selectedAvatarFile = null;
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

  resetForm(): void {
    this.coachForm.reset();
    this.specialtiesFormArray.clear();
    this.languagesFormArray.clear();
    this.coachForm.patchValue({
      timezone: 'Europe/Paris',
      responseTime: '< 24h'
    });
    this.selectedAvatarName = '';
    this.selectedAvatarFile = null;
    this.currentAvatarBase64 = '';
    this.currentAvatarMimeType = '';
  }

  loadCoaches(): void {
    this.coachManagementService.getAllCoaches().subscribe({
      next: (coaches) => {
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

  onDeleteCoach(coach: any): void {
    this.coachDeleted.emit(coach);
  }

  onSubmit(): void {
    if (this.coachForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData: CreateCoachDto = {
        ...this.coachForm.value,
        specialties: this.specialtiesFormArray.value,
        certifications: [],
        languages: this.languagesFormArray.value,
        avatarBase64: this.currentAvatarBase64,
        avatarMimeType: this.currentAvatarMimeType
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

      this.coachManagementService.createCoach(formData).subscribe({
        next: (coach) => {
          this.showSuccess = true;
          this.resetForm();
          this.coachCreated.emit(coach);
          
          setTimeout(() => {
            this.showSuccess = false;
            this.hideCreateForm();
          }, 2000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Erreur lors de la création du coach';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
}
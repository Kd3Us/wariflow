import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SessionHistoryService, SessionHistory, SessionDocument } from '../../../services/session-history.service';

@Component({
  selector: 'app-document-upload',
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.scss']
})
export class DocumentUploadComponent implements OnInit, OnChanges {
  @Input() session: SessionHistory | null = null;
  @Input() isVisible = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onDocumentUploaded = new EventEmitter<SessionDocument>();

  uploadForm!: FormGroup;
  documents: SessionDocument[] = [];
  
  isUploading = false;
  isLoadingDocuments = false;
  uploadProgress = 0;
  
  selectedFiles: File[] = [];
  dragOver = false;
  
  documentTypes = [
    { value: 'presentation', label: 'Présentation', icon: '📊', accept: '.ppt,.pptx,.pdf' },
    { value: 'document', label: 'Document', icon: '📄', accept: '.doc,.docx,.pdf,.txt' },
    { value: 'image', label: 'Image', icon: '🖼️', accept: '.jpg,.jpeg,.png,.gif,.svg' },
    { value: 'video', label: 'Vidéo', icon: '🎥', accept: '.mp4,.avi,.mov,.wmv' },
    { value: 'audio', label: 'Audio', icon: '🎵', accept: '.mp3,.wav,.ogg' },
    { value: 'other', label: 'Autre', icon: '📎', accept: '*' }
  ];
  
  predefinedTags = [
    'Support de cours',
    'Exercice',
    'Ressources',
    'Template',
    'Exemple',
    'Référence',
    'Action plan',
    'Checklist',
    'Guide',
    'Fiche récap'
  ];
  
  maxFileSize = 10 * 1024 * 1024; // 10MB
  allowedExtensions = [
    'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
    'jpg', 'jpeg', 'png', 'gif', 'svg',
    'mp4', 'avi', 'mov', 'wmv',
    'mp3', 'wav', 'ogg',
    'txt', 'csv', 'zip', 'rar'
  ];

  constructor(
    private fb: FormBuilder,
    private sessionHistoryService: SessionHistoryService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['session'] && this.session) {
      this.loadDocuments();
    }
  }

  initializeForm(): void {
    this.uploadForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['document', Validators.required],
      description: [''],
      tags: ['']
    });
  }

  loadDocuments(): void {
    if (!this.session) return;
    
    this.isLoadingDocuments = true;
    this.sessionHistoryService.getSessionDocuments(this.session.id).subscribe({
      next: (documents) => {
        this.documents = documents;
        this.isLoadingDocuments = false;
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.isLoadingDocuments = false;
      }
    });
  }

  onFileSelect(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.processSelectedFiles(files);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    
    const files = Array.from(event.dataTransfer?.files || []) as File[];
    this.processSelectedFiles(files);
  }

  processSelectedFiles(files: File[]): void {
    const validFiles = files.filter(file => this.validateFile(file));
    this.selectedFiles = [...this.selectedFiles, ...validFiles];
    
    if (validFiles.length > 0 && validFiles.length === 1) {
      this.uploadForm.patchValue({
        name: this.getFileNameWithoutExtension(validFiles[0].name),
        type: this.guessFileType(validFiles[0])
      });
    }
  }

  validateFile(file: File): boolean {
    // Vérifier la taille
    if (file.size > this.maxFileSize) {
      console.error(`Fichier trop volumineux: ${file.name} (${this.formatFileSize(file.size)})`);
      return false;
    }

    // Vérifier l'extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension && !this.allowedExtensions.includes(extension)) {
      console.error(`Type de fichier non autorisé: ${file.name}`);
      return false;
    }

    return true;
  }

  guessFileType(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension || '')) return 'image';
    if (['pdf', 'doc', 'docx'].includes(extension || '')) return 'document';
    if (['ppt', 'pptx'].includes(extension || '')) return 'presentation';
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension || '')) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(extension || '')) return 'audio';
    
    return 'other';
  }

  getFileNameWithoutExtension(filename: string): string {
    return filename.substring(0, filename.lastIndexOf('.')) || filename;
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  uploadDocuments(): void {
    if (!this.uploadForm.valid || this.selectedFiles.length === 0 || !this.session || this.isUploading) {
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    
    const formValue = this.uploadForm.value;
    const tags = formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [];
    
    const uploadPromises = this.selectedFiles.map((file, index) => {
      const documentData = {
        name: this.selectedFiles.length === 1 ? formValue.name : `${formValue.name} (${index + 1})`,
        type: formValue.type,
        uploadedBy: 'current-user',
        description: formValue.description,
        tags: tags
      };

      return this.sessionHistoryService.uploadDocument(this.session!.id, file, documentData).toPromise();
    });

    Promise.all(uploadPromises).then((uploadedDocuments) => {
      this.isUploading = false;
      this.uploadProgress = 100;
      
      console.log('Documents uploadés avec succès');
      
      uploadedDocuments.forEach(doc => {
        if (doc) {
          this.onDocumentUploaded.emit(doc);
        }
      });
      
      this.resetForm();
      this.loadDocuments();
      
    }).catch((error) => {
      console.error('Error uploading documents:', error);
      this.isUploading = false;
      console.error('Erreur lors de l\'upload');
    });
  }

  resetForm(): void {
    this.uploadForm.reset({
      type: 'document'
    });
    this.selectedFiles = [];
    this.uploadProgress = 0;
  }

  close(): void {
    this.resetForm();
    this.onClose.emit();
  }

  downloadDocument(document: SessionDocument): void {
    window.open(document.url, '_blank');
  }

  deleteDocument(document: SessionDocument): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    // TODO: Implémenter la suppression côté backend
    console.log('Delete document:', document.id);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(type: string): string {
    const typeInfo = this.documentTypes.find(t => t.value === type);
    return typeInfo?.icon || '📎';
  }

  getFileTypeLabel(type: string): string {
    const typeInfo = this.documentTypes.find(t => t.value === type);
    return typeInfo?.label || 'Fichier';
  }

  addTag(tag: string): void {
    const currentTags = this.uploadForm.get('tags')?.value || '';
    const tagsArray = currentTags.split(',').map((t: string) => t.trim()).filter(Boolean);
    
    if (!tagsArray.includes(tag)) {
      tagsArray.push(tag);
      this.uploadForm.patchValue({
        tags: tagsArray.join(', ')
      });
    }
  }

  removeTag(tagToRemove: string): void {
    const currentTags = this.uploadForm.get('tags')?.value || '';
    const tagsArray = currentTags.split(',')
      .map((t: string) => t.trim())
      .filter((tag: string) => tag && tag !== tagToRemove);
    
    this.uploadForm.patchValue({
      tags: tagsArray.join(', ')
    });
  }

  getCurrentTags(): string[] {
    const currentTags = this.uploadForm.get('tags')?.value || '';
    return currentTags.split(',').map((t: string) => t.trim()).filter(Boolean);
  }

  isValidForm(): boolean {
    return this.uploadForm.valid && this.selectedFiles.length > 0;
  }

  getTotalSelectedSize(): number {
    return this.selectedFiles.reduce((total, file) => total + file.size, 0);
  }

  canUploadMoreFiles(): boolean {
    return this.selectedFiles.length < 5; // Limite de 5 fichiers par upload
  }

  getAcceptedFileTypes(): string {
    const selectedType = this.uploadForm.get('type')?.value;
    const typeInfo = this.documentTypes.find(t => t.value === selectedType);
    return typeInfo?.accept || '*';
  }
}
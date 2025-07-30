import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="show" [class]="containerClasses">
      <div [class]="spinnerClasses">
        <div class="animate-spin rounded-full border-t-2 border-b-2" [class]="borderClasses"></div>
      </div>
      <p *ngIf="message" [class]="messageClasses">{{ message }}</p>
    </div>
  `,
  styles: [`
    .spinner-overlay {
      backdrop-filter: blur(2px);
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() show: boolean = false;
  @Input() message: string = 'Chargement...';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() overlay: boolean = false;
  @Input() color: 'primary' | 'secondary' | 'white' = 'primary';

  get containerClasses(): string {
    const base = 'flex flex-col items-center justify-center';
    if (this.overlay) {
      return `${base} fixed inset-0 bg-black bg-opacity-50 spinner-overlay z-50`;
    }
    return `${base} p-8`;
  }

  get spinnerClasses(): string {
    switch (this.size) {
      case 'small':
        return 'w-6 h-6';
      case 'large':
        return 'w-12 h-12';
      default:
        return 'w-8 h-8';
    }
  }

  get borderClasses(): string {
    const sizeClass = this.size === 'small' ? 'h-6 w-6' : this.size === 'large' ? 'h-12 w-12' : 'h-8 w-8';
    const colorClass = this.color === 'primary' ? 'border-blue-500' : 
                      this.color === 'secondary' ? 'border-gray-500' : 'border-white';
    return `${sizeClass} ${colorClass}`;
  }

  get messageClasses(): string {
    const textColor = this.overlay && this.color === 'white' ? 'text-white' : 'text-gray-600';
    return `mt-3 text-sm ${textColor}`;
  }
}
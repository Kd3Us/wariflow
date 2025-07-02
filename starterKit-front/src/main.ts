import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => {
    console.error('Application bootstrap error:', err);
    
    // Éviter la redirection immédiate qui peut causer des boucles
    // Laisser l'utilisateur voir l'erreur et décider
    setTimeout(() => {
      console.log('Redirecting to login page after error:', environment.externaleAuthUrl);
      window.location.href = environment.externaleAuthUrl;
    }, 2000); // Attendre 2 secondes avant de rediriger
  });

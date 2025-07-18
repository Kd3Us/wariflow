import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { LoaderService } from './loader.service';


@Injectable({
    providedIn: 'root'
  })
  export class WariflowService {
    constructor() {}
    private http = inject(HttpClient);
    private readonly apiUrl = environment.wariflowDocumentCorrect;

      correctWord(text: string): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const payload = {
            "model":"DOCUMENT",
            "type":"CORRECT",
            "data": {
                "query": text,
                "lang": "fr-FR"
            } 
        }
        return this.http.post<any>(`${this.apiUrl}`, {...payload}, 
            {
                headers: headers,
                responseType: 'json'
            }
        );
      }
    
}
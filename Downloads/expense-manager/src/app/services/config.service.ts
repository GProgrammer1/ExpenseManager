import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  private config: any = {};

  constructor(private http: HttpClient) {
    this.loadConfig().subscribe((data) =>{
      console.log("Config loaded: ", data);
      
    });
  }

  loadConfig(): Observable<any> {
    return this.http.get('/assets/config.json').pipe(
      tap(config => this.config = config)
    );
  }

  getConfig(key: string): string {
    const res =  this.config[key] || '';
    console.log("Config for key: ", key, " is: ", res);
    return res;
    
  }

  formatMessage(template: string, variables: Record<string, any>): string {
    return template.replace(/{{(.*?)}}/g, (_, key) => {
      const value = variables[key.trim()]; // Trim to remove spaces
      return typeof value === "object" ? JSON.stringify(value) : value || "";
    });
  }
  
}

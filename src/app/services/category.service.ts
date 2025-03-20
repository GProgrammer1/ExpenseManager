import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private http: HttpClient) { }

  getExpenseCategories() {
    return this.http.get<any>(`${environment.categoryUrl}/expense`);
  }

  getIncomeCategories() {
    return this.http.get<any>(`${environment.categoryUrl}/income`);
  }

}

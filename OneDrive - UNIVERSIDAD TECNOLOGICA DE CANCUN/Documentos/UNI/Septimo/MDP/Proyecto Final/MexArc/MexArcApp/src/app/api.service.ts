import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) {} 
  private baseUrl: string = 'http://20.115.67.143/api'; // Cambia esto según la ruta de tu API


  getZonasArqueologicas(e:{
    search: Array<string>;}): Observable<any> {
    return this.http.post(`${this.baseUrl}/GetInfoFilter`,{
     "search":e.search
  });
  }
  getInfoFilters(): Observable<any> {
    return this.http.post(`${this.baseUrl}/GetInfoSearch`,{});
  }
}

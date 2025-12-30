import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Store } from '../models/store.model';

@Injectable({
  providedIn: 'root'
})
export class StoresService {
  private apiUrl = 'http://localhost:5000/api/stores';

  constructor(private http: HttpClient) { }

  getStores(): Observable<Store[]> {
    return this.http.get<Store[]>(this.apiUrl);
  }

  getStore(id: number): Observable<Store> {
    return this.http.get<Store>(`${this.apiUrl}/${id}`);
  }
}

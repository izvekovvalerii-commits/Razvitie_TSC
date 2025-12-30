import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = 'http://localhost:5000/api/projects';

  constructor(private http: HttpClient) { }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl);
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  createProject(project: Project): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }

  updateProject(id: number, project: Project): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, project);
  }

  updateStatus(id: number, status: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

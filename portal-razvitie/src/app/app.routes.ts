import { Routes } from '@angular/router';
import { StoresComponent } from './pages/stores/stores';
import { ProjectsComponent } from './pages/projects/projects';
import { TasksComponent } from './pages/tasks/tasks';
import { HeroComponent } from './components/hero/hero';
import { ProjectDetailsComponent } from './pages/project-details/project-details';
import { LoginComponent } from './pages/login/login';
import { WelcomeComponent } from './pages/welcome/welcome';
import { DashboardsComponent } from './pages/dashboards/dashboards';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: '',
        canActivate: [AuthGuard],
        children: [
            { path: '', component: WelcomeComponent },
            { path: 'home', component: HeroComponent },
            { path: 'dashboards', component: DashboardsComponent },
            { path: 'stores', component: StoresComponent },
            { path: 'projects', component: ProjectsComponent },
            { path: 'projects/:id', component: ProjectDetailsComponent },
            { path: 'tasks', component: TasksComponent },
        ]
    },
    { path: '**', redirectTo: '/' }
];

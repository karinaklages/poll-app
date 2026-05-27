import { Routes } from '@angular/router';
import { HomeComponent } from './layout/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'survey/:id', loadComponent: () => import('./layout/survey-detail/survey-detail.component').then(m => m.SurveyDetailComponent) }
];
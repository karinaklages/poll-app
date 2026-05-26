import { Routes } from '@angular/router';
import { HomeComponent } from './layout/home/home.component';
import { SurveyDetailComponent } from './layout/survey-detail/survey-detail.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'survey/detail', component: SurveyDetailComponent }
];
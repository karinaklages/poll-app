import { Component } from '@angular/core';
import { HeroComponent } from './hero/hero.component';
import { SurveyListComponent } from './survey-list/survey-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, SurveyListComponent],
  template: `
    <app-hero />
    <app-survey-list />
    `
})
export class HomeComponent {}
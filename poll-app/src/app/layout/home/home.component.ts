import { Component } from '@angular/core';
import { HeroComponent } from './hero/hero.component';
import { SurveyListComponent } from './survey-list/survey-list.component';
import { SurveyNewComponent } from '../survey-new/survey-new.component';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, SurveyListComponent, SurveyNewComponent],
  template: `
    <app-hero (openNewSurvey)="dialog.open()" />
    <app-survey-list />
    <app-survey-new #dialog />
  `
})
export class HomeComponent {}
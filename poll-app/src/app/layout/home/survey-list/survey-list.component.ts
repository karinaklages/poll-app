import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SurveyListAllComponent } from '../survey-list-all/survey-list-all.component';

interface Survey {
    id: string;
    category: string;
    title: string;
    endsInDays: number;
}

@Component({
    selector: 'app-survey-list',
    standalone: true,
    imports: [CommonModule, SurveyListAllComponent],
    templateUrl: './survey-list.component.html',
    styleUrl: './survey-list.component.scss'
})
export class SurveyListComponent {
    featuredSurveys: Survey[] = [
        { id: '1', category: 'Team Activities', title: "Let's plan the next team event together", endsInDays: 1 },
        { id: '2', category: 'Health & Wellness', title: 'Fit and wellness survey', endsInDays: 2 },
        { id: '3', category: 'Gaming & Entertainment', title: 'Gaming habits and favorite games', endsInDays: 3 },
    ];
}
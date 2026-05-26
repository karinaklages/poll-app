import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface BarAnswer {
    letter: string;
    percent: number;
}

interface QuestionResult {
    question: string;
    answers: BarAnswer[];
}

@Component({
    selector: 'app-survey-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './survey-detail.component.html',
    styleUrl: './survey-detail.component.scss'
})
export class SurveyDetailComponent {

    isOpen = true;
    hasResults = true;

    results: QuestionResult[] = [
        {
            question: 'Which date would work best for you?',
            answers: [
                { letter: 'A', percent: 27 },
                { letter: 'B', percent: 44 },
                { letter: 'C', percent: 8  },
                { letter: 'D', percent: 26 },
            ]
        }
    ];

    open() { this.isOpen = true; }
    close() { this.isOpen = false; }

    completeSurvey() {
        console.log('Survey completed');
    }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

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
export class SurveyDetailComponent implements OnInit {

    surveyId!: string;

    isOpen = true;
    hasResults = true;
    clicked = false;
    hovered = false;

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

    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.surveyId = this.route.snapshot.paramMap.get('id')!;
        // Later: Supabase Call 
        console.log('Survey ID:', this.surveyId);
    }

    open() { this.isOpen = true; }
    close() { this.isOpen = false; }

    completeSurvey() {
        console.log('Survey completed');
    }

    onMouseEnter() { this.hovered = true; }
    onMouseLeave() { this.hovered = false; this.clicked = false; }

    onNavBtnClick() {
        this.clicked = true;
    }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';

// Interfaces
export interface SurveyAnswer {
    letter: string;
    value: string;
}

export interface SurveyQuestion {
    id?: string;
    order: number;
    text: string;
    allow_multiple: boolean;
    answers: SurveyAnswer[];
}

export interface Survey {
    id: string;
    name: string;
    description: string | null;
    end_date: string | null;
    category: string | null;
    status: 'draft' | 'published';
    questions: SurveyQuestion[];
}

export interface BarAnswer {
    letter: string;
    value: string;
    count: number;
    percent: number;
}

export interface QuestionResult {
    question: string;
    answers: BarAnswer[];
}

// Later: Supabase Call 
const MOCK_SURVEY: Survey = {
    id: '1',
    name: "Let's plan the next team event together",
    description: "We want to create team activities that everyone will enjoy – share your preferences and ideas in our survey to help us plan better experiences together.",
    end_date: '2025-09-01',
    category: 'Team Activities',
    status: 'published',
    questions: [
        {
            order: 1,
            text: 'Which date would work best for you?',
            allow_multiple: true,
            answers: [
                { letter: 'a', value: '19.09.2025, Friday' },
                { letter: 'b', value: '10.10.2025, Friday' },
                { letter: 'c', value: '11.10.2025, Saturday' },
                { letter: 'd', value: '31.10.2025, Friday' },
            ]
        },
        {
            order: 2,
            text: 'Choose the activities you prefer',
            allow_multiple: true,
            answers: [
                { letter: 'a', value: 'Outdoor adventure kayaking' },
                { letter: 'b', value: 'Office Costume Party' },
                { letter: 'c', value: 'Bowling, mini-golf, volleyball' },
                { letter: 'd', value: 'Beach party, Music & cocktails' },
                { letter: 'e', value: 'Escape room' },
            ]
        },
        {
            order: 3,
            text: "What's most important to you in a team event?",
            allow_multiple: false,
            answers: [
                { letter: 'a', value: 'Team bonding' },
                { letter: 'b', value: 'Food and drinks' },
                { letter: 'c', value: 'Trying something new' },
                { letter: 'd', value: 'Keeping it stress-free' },
            ]
        },
        {
            order: 4,
            text: 'How long would you prefer the event to last?',
            allow_multiple: false,
            answers: [
                { letter: 'a', value: 'Half a day' },
                { letter: 'b', value: 'Full day' },
                { letter: 'c', value: 'Evening only' },
            ]
        }
    ]
};

const MOCK_RESULTS: QuestionResult[] = [
    {
        question: 'Which date would work best for you?',
        answers: [
            { letter: 'A', value: '19.09.2025, Friday',   count: 5,  percent: 27 },
            { letter: 'B', value: '10.10.2025, Friday',   count: 8,  percent: 44 },
            { letter: 'C', value: '11.10.2025, Saturday', count: 1,  percent: 8  },
            { letter: 'D', value: '31.10.2025, Friday',   count: 4,  percent: 26 },
        ]
    }
];

// Component
@Component({
    selector: 'app-survey-detail',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule],
    templateUrl: './survey-detail.component.html',
    styleUrl: './survey-detail.component.scss'
})
export class SurveyDetailComponent implements OnInit {

    surveyId!: string;

    isOpen = true;
    clicked = false;
    hovered = false;
    completed = false;

    survey: Survey | null = null;
    results: QuestionResult[] = [];

    get hasResults(): boolean {
        return this.results.length > 0;
    }

    form!: FormGroup;

    constructor(
        private route: ActivatedRoute,
        private fb: FormBuilder,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.surveyId = this.route.snapshot.paramMap.get('id')!;
        this.loadSurvey();
    }

    // Data Loading
    private loadSurvey(): void {
        // Later: Superbase Call
        // const { data } = await this.supabaseService.getSurvey(this.surveyId);
        this.survey = MOCK_SURVEY;
        this.buildForm(this.survey);
        this.loadResults();
    }

    private loadResults(): void {
        // Later: Superbase Call
        // const { data } = await this.supabaseService.getResults(this.surveyId);
        this.results = MOCK_RESULTS;
    }

    // Form
    private buildForm(survey: Survey): void {
        const questionControls = survey.questions.map(q =>
            this.fb.group({
                questionId: [q.id ?? q.order.toString()],
                selectedAnswers: this.fb.array(
                    q.answers.map(() => this.fb.control(false))
                )
            })
        );

        this.form = this.fb.group({
            questions: this.fb.array(questionControls)
        });
    }

    get questionsArray(): FormArray {
        return this.form.get('questions') as FormArray;
    }

    answersArray(questionIndex: number): FormArray {
        return (this.questionsArray.at(questionIndex) as FormGroup)
            .get('selectedAnswers') as FormArray;
    }

    // Answer Selection
    onAnswerChange(questionIndex: number, answerIndex: number): void {
        if (!this.survey) return;

        const question = this.survey.questions[questionIndex];
        if (question.allow_multiple) return;

        const arr = this.answersArray(questionIndex);

        arr.controls.forEach((ctrl, i) => {
            ctrl.setValue(i === answerIndex, { emitEvent: false });
        });
    }

    // Format Helpers
    formatDate(dateStr: string | null): string {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    // Submit
    completeSurvey(): void {
        if (!this.survey) return;

        const payload = this.buildResponsePayload();
        console.log('Response payload for Supabase:', payload);

        // TODO: await this.supabaseService.submitResponse(this.surveyId, payload);

        this.updateResultsOptimistically(payload);

        this.completed = true;
        this.form.disable();
    }

    private buildResponsePayload() {
        const raw = this.form.getRawValue();
        return {
            survey_id: this.surveyId,
            submitted_at: new Date().toISOString(),
            answers: raw.questions.flatMap((q: any, qi: number) => {
                const question = this.survey!.questions[qi];
                return q.selectedAnswers
                    .map((checked: boolean, ai: number) => checked ? {
                        question_order: question.order,
                        answer_letter: question.answers[ai].letter,
                        answer_value: question.answers[ai].value
                    } : null)
                    .filter(Boolean);
            })
        };
    }

    private updateResultsOptimistically(payload: any): void {
        if (!this.survey) return;

        const votesByQuestion = new Map<number, Set<string>>();
        for (const ans of payload.answers) {
            if (!votesByQuestion.has(ans.question_order)) {
                votesByQuestion.set(ans.question_order, new Set());
            }
            votesByQuestion.get(ans.question_order)!.add(ans.answer_letter);
        }

        const updatedResults: QuestionResult[] = this.survey.questions.map(q => {
            const existingResult = this.results.find(r => r.question === q.text);
            const newVotes = votesByQuestion.get(q.order) ?? new Set();

            const answers: BarAnswer[] = q.answers.map(a => {
                const existing = existingResult?.answers.find(
                    r => r.letter.toLowerCase() === a.letter.toLowerCase()
                );
                const oldCount = existing?.count ?? 0;
                const addVote = newVotes.has(a.letter) ? 1 : 0;
                return {
                    letter: a.letter.toUpperCase(),
                    value: a.value,
                    count: oldCount + addVote,
                    percent: 0
                };
            });

            const total = answers.reduce((sum, a) => sum + a.count, 0);
            if (total > 0) {
                answers.forEach(a => a.percent = Math.round((a.count / total) * 100));
            }

            return { question: q.text, answers };
        }).filter(r => r.answers.some(a => a.count > 0));

        this.results = updatedResults;
    }

    // Navigation Button
    onMouseEnter() { this.hovered = true; }
    onMouseLeave() { this.hovered = false; this.clicked = false; }
    onNavBtnClick() { this.clicked = true; }

    // Close
    close(): void {
        this.router.navigate(['/']);
    }
}
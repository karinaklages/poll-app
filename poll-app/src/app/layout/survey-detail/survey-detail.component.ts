import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { Supabase } from '../../supabase';

// Interfaces
export interface SurveyAnswer {
    letter: string;
    value: string;
}

export interface SurveyQuestion {
    id: string;
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

    private route = inject(ActivatedRoute);
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private supabaseService = inject(Supabase);

    ngOnInit(): void {
        this.surveyId = this.route.snapshot.paramMap.get('id')!;
        this.loadSurvey();
    }

    // Data Loading
    private async loadSurvey(): Promise<void> {
        // Survey
        const { data: surveyData } = await this.supabaseService.supabase
            .from('surveys')
            .select('*')
            .eq('id', this.surveyId)
            .single();

        if (!surveyData) return;

        // Questions
        const { data: questionsData } = await this.supabaseService.supabase
            .from('questions')
            .select('*')
            .eq('survey_id', this.surveyId)
            .order('sort_order');

        this.survey = {
            id: surveyData.id,
            name: surveyData.title,
            description: surveyData.description,
            end_date: surveyData.end_date,
            category: surveyData.category,
            questions: (questionsData ?? []).map((q: any) => ({
                id: q.id,
                order: q.sort_order,
                text: q.question_text,
                allow_multiple: q.allow_multiple,
                answers: q.options ?? []
            }))
        };

        this.buildForm(this.survey);
        await this.loadResults();
    }

    private async loadResults(): Promise<void> {
        if (!this.survey) return;

        const rawResults = await this.supabaseService.getResults(this.surveyId);

        const updatedResults: QuestionResult[] = this.survey.questions.map(q => {
            const questionResponses = rawResults.filter(r => r.question_id === q.id);

            const answers: BarAnswer[] = q.answers.map(a => ({
                letter: a.letter.toUpperCase(),
                value: a.value,
                count: questionResponses.filter(r => r.answer_value === a.letter).length,
                percent: 0
            }));

            const total = answers.reduce((sum, a) => sum + a.count, 0);
            if (total > 0) {
                answers.forEach(a => a.percent = Math.round((a.count / total) * 100));
            }

            return { question: q.text, answers };
        }).filter(r => r.answers.some(a => a.count > 0));

        this.results = updatedResults;
    }

    // Form
    private buildForm(survey: Survey): void {
        const questionControls = survey.questions.map(q =>
            this.fb.group({
                questionId: [q.id],
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
    async completeSurvey(): Promise<void> {
        if (!this.survey) return;

        const respondentToken = crypto.randomUUID();
        const raw = this.form.getRawValue();

        const answers = raw.questions.flatMap((q: any, qi: number) => {
            const question = this.survey!.questions[qi];
            return q.selectedAnswers
                .map((checked: boolean, ai: number) => checked ? {
                    questionId: question.id,
                    answerLetter: question.answers[ai].letter,
                    answerValue: question.answers[ai].value
                } : null)
                .filter(Boolean);
        });

        for (const answer of answers) {
            await this.supabaseService.submitResponse(
                this.surveyId,
                answer.questionId,
                answer.answerLetter,
                respondentToken
            );
        }

        await this.loadResults();
        this.completed = true;
        this.form.disable();
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
import { Component, OnInit, inject, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { Supabase } from '../../supabase';
import { SurveyNewComponent } from '../survey-new/survey-new.component';

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
    imports: [CommonModule, RouterLink, ReactiveFormsModule, SurveyNewComponent],
    templateUrl: './survey-detail.component.html',
    styleUrl: './survey-detail.component.scss'
})
export class SurveyDetailComponent implements OnInit {

    @ViewChild('dialog') dialog!: SurveyNewComponent;

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
    private cdr = inject(ChangeDetectorRef);

    /**
     * On init, retrieves the survey ID from the route parameters, loads the survey and its questions from Supabase, builds the reactive form based on the survey structure, and loads existing results to display.
     */
    ngOnInit(): void {
        this.surveyId = this.route.snapshot.paramMap.get('id')!;
        this.loadSurvey();
    }

    /**
     * Loads the survey details and questions from Supabase, maps them to the Survey interface, builds the reactive form, and loads the results. This is called on component init and after submitting a response to refresh the results.
     */
    private async loadSurvey(): Promise<void> {
        const surveyData = await this.fetchSurveyData();
        if (!surveyData) return;
        const questionsData = await this.fetchQuestionsData();
        this.survey = this.mapToSurvey(surveyData, questionsData ?? []);
        this.buildForm(this.survey);
        await this.loadResults();
        this.cdr.detectChanges();
    }

    /**
     * Fetches the survey details from Supabase based on the survey ID. Returns null if the survey is not found or if there is an error.
     */
    private async fetchSurveyData() {
        const { data } = await this.supabaseService.supabase
            .from('surveys').select('*')
            .eq('id', this.surveyId).single();
        return data;
    }

    /**
     * Fetches the questions for the survey from Supabase based on the survey ID. Returns null if there are no questions or if there is an error.
     */
    private async fetchQuestionsData() {
        const { data } = await this.supabaseService.supabase
            .from('questions').select('*')
            .eq('survey_id', this.surveyId).order('sort_order');
        return data;
    }

    /**
     * Maps the raw survey and questions data from Supabase to the Survey interface used in the component. This includes mapping the question options to the answers array and ensuring the correct types are set.
     */
    private mapToSurvey(surveyData: any, questionsData: any[]): Survey {
        return {
            id: surveyData.id,
            name: surveyData.title,
            description: surveyData.description,
            end_date: surveyData.end_date,
            category: surveyData.category,
            questions: questionsData.map(q => ({
                id: q.id, order: q.sort_order, text: q.question_text,
                allow_multiple: q.allow_multiple, answers: q.options ?? []
            }))
        };
    }

    /**
     * Loads the survey results from Supabase, maps them to the QuestionResult interface, and calculates the count and percentage for each answer option. Only questions with at least one response are included in the results.
     */
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

    /**
     * Builds the reactive form based on the survey structure. Each question is represented as a FormGroup containing a FormArray of answer controls. The answer controls are checkboxes for multiple choice questions and radio buttons for single choice questions. The form is initialized with all answers unchecked.
     */
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

    /**
     * Helper to get the questions FormArray from the form. This is used to dynamically access the question controls and their nested answer controls in the template. The answers FormArray for each question can be accessed through the questionGroup method.
     */
    get questionsArray(): FormArray {
        return this.form.get('questions') as FormArray;
    }

    /**
     * Helper to get a specific question FormGroup by index. This is used to access the selectedAnswers FormArray for that question when handling answer changes.
     */
    answersArray(questionIndex: number): FormArray {
        return (this.questionsArray.at(questionIndex) as FormGroup)
            .get('selectedAnswers') as FormArray;
    }

    /**
     * Event handler for when an answer option is changed. If the question does not allow multiple answers, this will uncheck all other options when one is selected. This ensures that only one answer can be selected for single choice questions. For multiple choice questions, no changes are made to the other options.
     */
    onAnswerChange(questionIndex: number, answerIndex: number): void {
        if (!this.survey) return;
        const question = this.survey.questions[questionIndex];
        if (question.allow_multiple) return;
        const arr = this.answersArray(questionIndex);
        arr.controls.forEach((ctrl, i) => {
            ctrl.setValue(i === answerIndex, { emitEvent: false });
        });
    }

    /**
     * Formats a date string into a human-readable format (DD.MM.YYYY). If the date string is null, an empty string is returned. This is used to display the survey end date in the template. The date is formatted according to German locale conventions.
     */
    formatDate(dateStr: string | null): string {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    /**
     * Handles the submission of the survey form. It generates a unique respondent token, maps the selected answers to the format expected by Supabase, submits each answer as a response, reloads the results to reflect the new response, and disables the form to prevent multiple submissions. The respondent token is used to group responses from the same user without requiring authentication. After submission, the results are updated to show the new counts and percentages for each answer option.
     */
    async completeSurvey(): Promise<void> {
        if (!this.survey) return;
        const respondentToken = crypto.randomUUID();
        const answers = this.mapFormAnswers();
        for (const answer of answers) {
            await this.supabaseService.submitResponse(
                this.surveyId, answer.questionId, answer.answerLetter, respondentToken
            );
        }
        await this.loadResults();
        this.cdr.detectChanges();
        this.completed = true;
        this.form.disable();
    }

    /**
     * Maps the form values to an array of answers in the format expected by Supabase. It iterates through each question and its selected answers, creating an object for each selected answer that includes the question ID, answer letter, and answer value. Only selected answers are included in the resulting array. This method is called when submitting the survey to prepare the data for insertion into the database.
     */
    private mapFormAnswers() {
        const raw = this.form.getRawValue();
        return raw.questions.flatMap((q: any, qi: number) => {
            const question = this.survey!.questions[qi];
            return q.selectedAnswers
                .map((checked: boolean, ai: number) => checked ? {
                    questionId: question.id,
                    answerLetter: question.answers[ai].letter,
                    answerValue: question.answers[ai].value
                } : null)
                .filter(Boolean);
        });
    }

    /**
     * Event handlers for mouse enter, mouse leave, and navigation button click. These are used to manage the hovered and clicked states for styling purposes. When the user hovers over the survey card, the hovered state is set to true, which can trigger a visual change in the template. When the mouse leaves the card, the hovered state is set to false and the clicked state is reset. When the navigation button is clicked, the clicked state is set to true, which can also trigger a visual change. These states help provide feedback to the user about their interactions with the survey card.
     */
    onMouseEnter() { this.hovered = true; }
    onMouseLeave() { this.hovered = false; this.clicked = false; }
    onNavBtnClick() { this.clicked = true; }

    /**
     * Navigates back to the home page when the close button is clicked. This is used to exit the survey detail view and return to the list of surveys. The router is used to programmatically navigate to the root path, which corresponds to the home page. This method is called when the user clicks the close button in the template.
     */
    close(): void {
        this.router.navigate(['/']);
    }
}
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Supabase } from '../../supabase';

function minAnswers(min: number) {
    return (control: AbstractControl) => {
        const arr = control as FormArray;
        const filled = arr.controls.filter(c => c.get('value')?.value?.trim());
        return filled.length >= min ? null : { minAnswers: { required: min, actual: filled.length } };
    };
}

function minQuestions(control: AbstractControl) {
    const arr = control as FormArray;
    return arr.length >= 1 ? null : { minQuestions: true };
}

@Component({
    selector: 'app-survey-new',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './survey-new.component.html',
    styleUrl: './survey-new.component.scss'
})
export class SurveyNewComponent implements OnInit {
    readonly maxLength = 60;
    readonly categories = [
        'Team Activities',
        'Health & Wellness',
        'Gaming & Entertainment',
        'Education & Learning',
        'Lifestyle & Preferences',
        'Technology & Innovation',
    ];
    readonly letters = 'abcdefghijklmnopqrstuvwxyz';

    isOpen = false;
    categoryOpen = false;
    published = false;
    hovered = false;

    form!: FormGroup;

    private fb = inject(FormBuilder);
    private supabaseService = inject(Supabase);

    ngOnInit() {
        this.form = this.fb.group({
            surveyName: ['', [Validators.required, Validators.maxLength(this.maxLength)]],
            describingText: ['', Validators.maxLength(this.maxLength)],
            endDate: [null, Validators.required],
            selectedCategory: [null, Validators.required],
            questions: this.fb.array([this.createQuestion()], minQuestions)
        });
    }

    // Helpers
    createQuestion(): FormGroup {
        return this.fb.group({
            text: ['', [Validators.required, Validators.maxLength(this.maxLength)]],
            allowMultiple: [false],
            answers: this.fb.array(
                [this.createAnswer('a'), this.createAnswer('b')],
                minAnswers(2)
            )
        });
    }

    createAnswer(letter: string): FormGroup {
        return this.fb.group({
            letter: [letter],
            value: ['', Validators.maxLength(this.maxLength)]
        });
    }

    // Typed Accessors
    get questionsArray(): FormArray {
        return this.form.get('questions') as FormArray;
    }

    questionGroup(i: number): FormGroup {
        return this.questionsArray.at(i) as FormGroup;
    }

    answersArray(questionIndex: number): FormArray {
        return this.questionGroup(questionIndex).get('answers') as FormArray;
    }

    answerGroup(questionIndex: number, answerIndex: number): FormGroup {
        return this.answersArray(questionIndex).at(answerIndex) as FormGroup;
    }

    get isOddQuestions(): boolean {
        return this.questionsArray.length % 2 !== 0;
    }

    // Dialog
    open() { this.isOpen = true; }
    close() { this.isOpen = false; }

    // Category
    toggleCategory() { this.categoryOpen = !this.categoryOpen; }

    selectCategory(cat: string) {
        this.form.get('selectedCategory')!.setValue(cat);
        this.categoryOpen = false;
    }

    get selectedCategory(): string | null {
        return this.form?.get('selectedCategory')?.value ?? null;
    }

    // Clear Helpers
    clearField(fieldName: string) {
        this.form.get(fieldName)!.setValue('');
    }

    // Questions
    addQuestion() {
        this.questionsArray.push(this.createQuestion());
    }

    removeQuestion(index: number) {
        this.questionsArray.removeAt(index);
    }

    // Answers
    addAnswer(questionIndex: number) {
        const arr = this.answersArray(questionIndex);
        if (arr.length >= 6) return;
        arr.push(this.createAnswer(this.letters[arr.length]));
    }

    removeAnswer(questionIndex: number, answerIndex: number) {
        const arr = this.answersArray(questionIndex);
        arr.removeAt(answerIndex);
        arr.controls.forEach((ctrl, i) => ctrl.get('letter')!.setValue(this.letters[i]));
    }

    // Publish
    async publish() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const raw = this.form.getRawValue();

        const survey = await this.supabaseService.insertSurvey({
            title: raw.surveyName,
            description: raw.describingText || null,
            end_date: raw.endDate || null,
            category: raw.selectedCategory
        });

        if (survey) {
            await this.supabaseService.insertQuestions(survey.id, raw.questions);
        }

        this.published = true;
        this.form.reset();
        this.questionsArray.clear();
        this.questionsArray.push(this.createQuestion());
    }

    // private buildPayload() {
    //     const raw = this.form.getRawValue();
    //     return {
    //         name: raw.surveyName,
    //         description: raw.describingText || null,
    //         end_date: raw.endDate || null,
    //         category: raw.selectedCategory,
    //         questions: raw.questions.map((q: any, qi: number) => ({
    //             order: qi + 1,
    //             text: q.text,
    //             allow_multiple: q.allowMultiple,
    //             answers: q.answers.map((a: any) => ({
    //             letter: a.letter,
    //             value: a.value
    //             }))
    //         }))
    //     };
    // }

    closePublished() { this.published = false; }
    onMouseEnter() { this.hovered = true; }
    onMouseLeave() { this.hovered = false; }
}
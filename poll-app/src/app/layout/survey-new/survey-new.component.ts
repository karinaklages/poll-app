import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Supabase } from '../../supabase';

/**
 * Custom validator to ensure a minimum number of answers are filled for a question. This is used to validate the answers FormArray for each question in the survey creation form. The validator checks how many answer controls have a non-empty value and returns an error object if the count is less than the specified minimum. This ensures that users cannot create a question with too few answer options, which would not be valid for a survey.
 */
function minAnswers(min: number) {
    return (control: AbstractControl) => {
        const arr = control as FormArray;
        const filled = arr.controls.filter(c => c.get('value')?.value?.trim());
        return filled.length >= min ? null : { minAnswers: { required: min, actual: filled.length } };
    };
}

/**
 * Custom validator to ensure a minimum number of questions are added to the survey. This is used to validate the questions FormArray in the survey creation form. The validator checks how many question controls are present and returns an error object if the count is less than 1. This ensures that users cannot create a survey without any questions, which would not be valid.
 */
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
    private cdr = inject(ChangeDetectorRef);

    /**
     * Initializes the survey creation form with default values and validators. The form includes fields for the survey name, description, end date, selected category, and a FormArray of questions. Each question is a FormGroup that contains the question text, a boolean for allowing multiple answers, and a FormArray of answers. The form is set up to require at least one question and at least two answers for each question. This method is called when the component is initialized to prepare the form for user input.
     */
    ngOnInit() {
        this.form = this.fb.group({
            surveyName: ['', [Validators.required, Validators.maxLength(this.maxLength)]],
            describingText: ['', Validators.maxLength(this.maxLength)],
            endDate: [null, Validators.required],
            selectedCategory: [null, Validators.required],
            questions: this.fb.array([this.createQuestion()], minQuestions)
        });
    }

    /**
     * Helper to create a new question FormGroup with default values and validators. This is used when adding a new question to the survey form. Each question includes a text field, a boolean for allowing multiple answers, and a FormArray of answers. The question text is required and has a maximum length, and the answers array must have at least two filled answer options. This method is called when the user clicks the "Add Question" button in the template to add a new question to the form.
     */
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

    /**
     * Helper to create a new answer FormGroup with default values and validators. This is used when adding a new answer option to a question in the survey form. Each answer includes a letter (a, b, c, etc.) and a value field for the answer text. The value field is required and has a maximum length. This method is called when the user clicks the "Add Answer" button for a question in the template to add a new answer option to that question.
     */
    createAnswer(letter: string): FormGroup {
        return this.fb.group({
            letter: [letter],
            value: ['', Validators.maxLength(this.maxLength)]
        });
    }

    /**
     * Helper to get the questions FormArray from the form. This is used to dynamically access the question controls and their nested answer controls in the template. The answers FormArray for each question can be accessed through the questionGroup method. This getter simplifies access to the questions array in the template and allows for easier manipulation of the questions and their answers when adding or removing them from the form.
     */
    get questionsArray(): FormArray {
        return this.form.get('questions') as FormArray;
    }

    /**
     * Helper to get a specific question FormGroup by index. This is used to access the selectedAnswers FormArray for that question when handling answer changes. This method allows for easier access to the controls of a specific question, which is necessary when adding or removing answers for that question or when validating the answers. By providing the question index, this method returns the corresponding FormGroup for that question from the questions FormArray.
     */
    questionGroup(i: number): FormGroup {
        return this.questionsArray.at(i) as FormGroup;
    }

    /**
     * Helper to get the answers FormArray for a specific question by index. This is used to dynamically access the answer controls for a given question in the template. This method allows for easier manipulation of the answers for a specific question, such as adding or removing answer options. By providing the question index, this method returns the corresponding FormArray of answers for that question from the questions FormGroup.
     */
    answersArray(questionIndex: number): FormArray {
        return this.questionGroup(questionIndex).get('answers') as FormArray;
    }

    /**
     * Helper to get a specific answer FormGroup by question index and answer index. This is used to access the controls of a specific answer option for a given question in the template. This method allows for easier manipulation of a specific answer option, such as updating its value or validating it. By providing the question index and answer index, this method returns the corresponding FormGroup for that answer from the answers FormArray of the specified question.
     */
    answerGroup(questionIndex: number, answerIndex: number): FormGroup {
        return this.answersArray(questionIndex).at(answerIndex) as FormGroup;
    }

    /**
     * Helper to determine if the number of questions in the form is odd. This is used for styling purposes in the template, such as applying different styles to odd and even questions. By checking the length of the questions FormArray, this getter returns true if the number of questions is odd and false if it is even. This can be used in the template to conditionally apply CSS classes based on whether a question is in an odd or even position in the list of questions.
     */
    get isOddQuestions(): boolean {
        return this.questionsArray.length % 2 !== 0;
    }

    /**
     * Helper to open and close the survey creation dialog.
     */
    open() { this.isOpen = true; }
    close() { this.isOpen = false; }

    /**
     * Helper to toggle the category dropdown and select a category. The toggleCategory method is used to open and close the category selection dropdown in the template. The selectCategory method is used to set the selected category in the form when a category is chosen from the dropdown. It updates the selectedCategory form control with the chosen category and then closes the dropdown. The selectedCategory getter is used to easily access the currently selected category from the form, which can be useful for displaying the selected category in the template or for validation purposes.
     */
    toggleCategory() { this.categoryOpen = !this.categoryOpen; }

    /**
     * Sets the selected category in the form when a category is chosen from the dropdown. It updates the selectedCategory form control with the chosen category and then closes the dropdown. This method is called when the user clicks on a category option in the template to select it for the survey. By updating the form control, it ensures that the selected category is included in the form values when submitting the survey. After selecting a category, the dropdown is closed to provide feedback to the user that their selection has been made.
     */
    selectCategory(cat: string) {
        this.form.get('selectedCategory')!.setValue(cat);
        this.categoryOpen = false;
    }

    /**
     * Getter to easily access the currently selected category from the form. This is useful for displaying the selected category in the template or for validation purposes. By accessing the selectedCategory form control, this getter returns the current value of the selected category, or null if no category is selected. This allows for easier binding in the template when showing the selected category or when applying conditional logic based on whether a category has been chosen.
     */
    get selectedCategory(): string | null {
        return this.form?.get('selectedCategory')?.value ?? null;
    }

    /**
     * Clears the value of a specific form field.
     */
    clearField(fieldName: string) {
        this.form.get(fieldName)!.setValue('');
    }

    /**
     * Adds a new question to the questions FormArray in the form. This is called when the user clicks the "Add Question" button in the template. It uses the createQuestion helper method to generate a new question FormGroup with default values and validators, and then pushes it onto the questions FormArray. This allows users to dynamically add as many questions as they want to the survey form.
     */
    addQuestion() {
        this.questionsArray.push(this.createQuestion());
    }

    /**
     * Removes a question from the questions FormArray at the specified index. This is called when the user clicks the "Remove Question" button for a specific question in the template. By providing the index of the question to be removed, this method removes that question from the FormArray, allowing users to dynamically manage the number of questions in their survey form.
     */
    removeQuestion(index: number) {
        this.questionsArray.removeAt(index);
    }

    /**
     * Adds a new answer option to the answers FormArray for a specific question. This is called when the user clicks the "Add Answer" button for a specific question in the template. It uses the createAnswer helper method to generate a new answer FormGroup with default values and validators, and then pushes it onto the answers FormArray for that question. The letter for the new answer is determined based on the current number of answers for that question, ensuring that it follows the sequence of letters (a, b, c, etc.). This allows users to dynamically add answer options to each question in their survey form.
     */
    addAnswer(questionIndex: number) {
        const arr = this.answersArray(questionIndex);
        if (arr.length >= 6) return;
        arr.push(this.createAnswer(this.letters[arr.length]));
    }

    /**
     * Removes an answer option from the answers FormArray for a specific question at the specified index. This is called when the user clicks the "Remove Answer" button for a specific answer option in the template. By providing the question index and answer index, this method removes that answer from the FormArray for that question. After removing an answer, it also updates the letter values for the remaining answers to ensure they remain in sequence (a, b, c, etc.). This allows users to dynamically manage the number of answer options for each question in their survey form.
     */
    removeAnswer(questionIndex: number, answerIndex: number) {
        const arr = this.answersArray(questionIndex);
        arr.removeAt(answerIndex);
        arr.controls.forEach((ctrl, i) => ctrl.get('letter')!.setValue(this.letters[i]));
    }

    /**
     * Handles the submission of the survey form. It first checks if the form is valid, and if not, it marks all controls as touched to trigger validation messages in the template. If the form is valid, it calls the insertSurvey method to save the survey and its questions to the database using Supabase. After successfully inserting the survey, it shows a toast notification to inform the user that their survey has been published, and then resets the form to allow for creating a new survey. This method is called when the user clicks the "Publish Survey" button in the template.
     */
    async publish() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        await this.insertSurvey();
        this.showPublishedToast();
        this.resetForm();
    }

    /**
     * Inserts the survey and its questions into the database using Supabase. It first prepares the survey data from the form values and calls the insertSurvey method of the Supabase service to save the survey. If the survey is successfully saved, it then prepares the questions data and calls the insertQuestions method of the Supabase service to save the questions associated with that survey. This method handles the communication with the backend to persist the new survey created by the user.
     */
    private async insertSurvey() {
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
    }

    /**
     * Shows a toast notification to inform the user that their survey has been published. The published state is set to true, which can trigger the display of a toast message in the template. After 2.5 seconds, the published state is reset to false to hide the toast message. This provides feedback to the user that their action of publishing the survey was successful.
     */
    private showPublishedToast() {
        this.published = true;
        setTimeout(() => {
            this.published = false;
            this.cdr.detectChanges();
        }, 2500);
    }

    /**
     * Resets the survey creation form to its initial state. This is called after successfully publishing a survey to clear the form and allow the user to create a new survey if they wish. The form is reset to clear all values, the questions FormArray is cleared and a new default question is added back in. This ensures that the form is ready for new input without any leftover data from the previous survey.
     */
    private resetForm() {
        this.form.reset();
        this.questionsArray.clear();
        this.questionsArray.push(this.createQuestion());
    }

    /**
     * Event handlers for mouse enter and leave to manage the hovered state for styling purposes.
     */
    closePublished() { this.published = false; }
    onMouseEnter() { this.hovered = true; }
    onMouseLeave() { this.hovered = false; }
}
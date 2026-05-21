import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Answer {
    id: string;
    value: string;
}

interface Question {
    id: string;
    text: string;
    allowMultiple: boolean;
    answers: Answer[];
}

@Component({
    selector: 'app-survey-new',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './survey-new.component.html',
    styleUrl: './survey-new.component.scss'
})
export class SurveyNewComponent {
    isOpen = false;
    surveyName = '';
    describingText = '';
    endDate = '';
    selectedCategory: string | null = null;
    categoryOpen = false;

    categories = [
        'Team Activities',
        'Health & Wellness',
        'Gaming & Entertainment',
        'Education & Learning',
        'Lifestyle & Preferences',
        'Technology & Innovation',
    ];

    questions: Question[] = [
        { id: '1', text: '', allowMultiple: false, answers: [
        { id: 'a', value: '' },
        { id: 'b', value: '' },
        ]}
    ];

    open() { this.isOpen = true; }
    close() { this.isOpen = false; }

    toggleCategory() { this.categoryOpen = !this.categoryOpen; }
    selectCategory(cat: string) { this.selectedCategory = cat; this.categoryOpen = false; }

    addQuestion() {
        const id = Date.now().toString();
        this.questions.push({
        id,
        text: '',
        allowMultiple: false,
        answers: [{ id: 'a', value: '' }, { id: 'b', value: '' }]
        });
    }

    removeQuestion(qId: string) {
        this.questions = this.questions.filter(q => q.id !== qId);
    }

    addAnswer(question: Question) {
        if (question.answers.length >= 6) return;
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const id = letters[question.answers.length] || Date.now().toString();
        question.answers.push({ id, value: '' });
    }

    removeAnswer(question: Question, answerId: string) {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        question.answers = question.answers
            .filter(a => a.id !== answerId)
            .map((a, i) => ({ ...a, id: letters[i] }));
    }

    get isOddQuestions(): boolean {
        return this.questions.length % 2 !== 0;
    }

    hovered = false;

    onMouseEnter() { this.hovered = true; }
    onMouseLeave() { this.hovered = false; }

    published = false;

    publish() {
        console.log('Publish', { surveyName: this.surveyName, questions: this.questions });
        this.published = true;
    }

    closePublished() {
        this.published = false;
    }

    clearSurveyName() { this.surveyName = ''; }
    clearEndDate() { this.endDate = ''; }
    clearDescribingText() { this.describingText = ''; }

    readonly maxLength = 60;
}
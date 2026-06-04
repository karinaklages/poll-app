import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SurveyListAllComponent } from '../survey-list-all/survey-list-all.component';
import { Supabase } from '../../../supabase';

interface SurveyCard {
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
export class SurveyListComponent implements OnInit {
    featuredSurveys: SurveyCard[] = [];

    private router = inject(Router);
    private supabaseService = inject(Supabase);
    private cdr = inject(ChangeDetectorRef);

    async ngOnInit() {
        const data = await this.fetchSurveys();
        if (!data) return;
        this.featuredSurveys = this.mapToSurveyCards(data);
        this.cdr.detectChanges();
    }

    private async fetchSurveys() {
        const { data } = await this.supabaseService.supabase
            .from('surveys')
            .select('id, title, category, end_date')
            .eq('is_active', true)
            .not('end_date', 'is', null)
            .gt('end_date', new Date().toISOString())
            .order('end_date', { ascending: true })
            .limit(3);
        return data;
    }

    private mapToSurveyCards(data: any[]): SurveyCard[] {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return data.map(s => {
            const end = new Date(s.end_date);
            end.setHours(0, 0, 0, 0);
            const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return { id: s.id, title: s.title, category: s.category, endsInDays: diff };
        });
    }

    openSurvey(id: string): void {
        this.router.navigate(['/survey', id]);
    }
}
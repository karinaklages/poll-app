import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SurveyListAllComponent } from '../survey-list-all/survey-list-all.component';
import { Supabase } from '../../../supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

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
export class SurveyListComponent implements OnInit, OnDestroy {
    featuredSurveys: SurveyCard[] = [];

    private router = inject(Router);
    private supabaseService = inject(Supabase);
    private cdr = inject(ChangeDetectorRef);
    private channel: RealtimeChannel | null = null;

    /**
     * Initializes the component by loading the featured surveys and setting up a real-time subscription to survey updates.
     */
    async ngOnInit() {
        await this.loadFeatured();
        this.subscribeRealtime();
    }

    /**
     * Cleans up the real-time subscription when the component is destroyed.
     */  
    ngOnDestroy() {
        this.channel?.unsubscribe();
    }

    /**
     * Fetches the featured surveys from the Supabase database and updates the featuredSurveys array.
     */
    private async loadFeatured() {
        const data = await this.fetchSurveys();
        if (!data) return;
        this.featuredSurveys = this.mapToSurveyCards(data);
        this.cdr.detectChanges();
    }

    /**
     * Subscribes to real-time updates for surveys using the Supabase client. When a new survey is inserted, it checks if the survey should be featured (active and not expired) and updates the featuredSurveys array accordingly. This allows the component to display new featured surveys in real-time without requiring a page refresh. The subscription is set up to listen for insert events on the surveys table, and the callback function processes the new survey data to determine if it should be added to the featured list.
     */
    private subscribeRealtime() {
        this.channel = this.supabaseService.subscribeToSurveys((newSurvey) => {
            const card = this.toFeaturedCard(newSurvey);
            if (!card) return;
            this.featuredSurveys = [...this.featuredSurveys, card]
                .sort((a, b) => a.endsInDays - b.endsInDays)
                .slice(0, 3);
            this.cdr.detectChanges();
        });
    }

    /**
     * Converts a survey object from the database into a SurveyCard if it meets the criteria for being featured (active and not expired). It checks if the survey is active and has an end date, then calculates how many days are left until the survey expires. If the survey is already expired or not active, it returns null, indicating that it should not be featured. This method is used to determine which surveys should be displayed in the featured section of the home page.
     */
    private toFeaturedCard(survey: any): SurveyCard | null {
        if (!survey.is_active || !survey.end_date) return null;
        const end = new Date(survey.end_date);
        end.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (end <= today) return null;
        const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { id: survey.id, title: survey.title, category: survey.category, endsInDays: diff };
    }

    /**
     * Fetches the active surveys that have an end date in the future from the Supabase database. It queries the 'surveys' table, filtering for surveys that are marked as active, have a non-null end date, and where the end date is greater than the current date. The results are ordered by end date in ascending order and limited to 3 surveys. This method is used to populate the featured surveys section on the home page with relevant and timely surveys for users to participate in.
     */
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

    /**
     * Maps the survey data to survey cards for display.
     */
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

    /**
     * Navigates to the survey detail page when a survey card is clicked. It takes the survey ID as a parameter and uses the Angular Router to navigate to the corresponding survey page. This allows users to view the details of the selected survey and participate in it. The method is triggered by a click event on the survey card in the template, providing an interactive way for users to access individual surveys from the featured list.
     */
    openSurvey(id: string): void {
        this.router.navigate(['/survey', id]);
    }
}
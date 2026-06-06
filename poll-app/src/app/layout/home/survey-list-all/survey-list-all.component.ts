import { Component, ElementRef, HostListener, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Supabase } from '../../../supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Survey {
  id: string;
  category: string;
  title: string;
  endsAt: Date;
}

@Component({
  selector: 'app-survey-list-all',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './survey-list-all.component.html',
  styleUrl: './survey-list-all.component.scss'
})
export class SurveyListAllComponent implements OnInit, OnDestroy {

  readonly categories = [
    'Team Activities',
    'Health & Wellness',
    'Gaming & Entertainment',
    'Education & Learning',
    'Lifestyle & Preferences',
    'Technology & Innovation',
  ];

  private allSurveys: Survey[] = [];
  activeTab: 'active' | 'past' = 'active';
  sortOpen = false;
  selectedCategory: string | null = null;

  private elementRef = inject(ElementRef);
  private router = inject(Router);
  private supabaseService = inject(Supabase);
  private cdr = inject(ChangeDetectorRef);
  private channel: RealtimeChannel | null = null;

  /**
   * Initializes the component by loading the surveys and setting up a real-time subscription to survey updates. The ngOnInit lifecycle hook is used to perform these actions when the component is created. The loadSurveys method fetches all surveys from the database, while the subscribeRealtime method sets up a subscription to listen for new surveys being added, allowing the list to update in real-time as new surveys are published.
   */
  async ngOnInit() {
    await this.loadSurveys();
    this.subscribeRealtime();
  }

  /**
   * Cleans up the real-time subscription when the component is destroyed.
   */
  ngOnDestroy() {
    this.channel?.unsubscribe();
  }

  /**
   * Fetches all surveys from the Supabase database and updates the allSurveys array. It queries the 'surveys' table, selecting the id, title, category, and end_date fields for surveys that have a non-null end date. The retrieved data is then mapped to the Survey interface and stored in the allSurveys array, which is used to display the list of surveys in the template. This method is called on component initialization to load the existing surveys when the page is first loaded.
   */
  private async loadSurveys() {
    const { data } = await this.supabaseService.supabase
      .from('surveys')
      .select('id, title, category, end_date')
      .not('end_date', 'is', null);
    if (!data) return;
    this.allSurveys = this.mapToSurveys(data);
    this.cdr.detectChanges();
  }

  /**
   * Subscribes to real-time updates for surveys using the Supabase client. When a new survey is inserted, it checks if the survey has an end date and is not already in the allSurveys array. If the survey is valid, it is added to the allSurveys array and the view is updated. This allows the component to display new surveys in real-time without requiring a page refresh. The subscription listens for insert events on the surveys table, and the callback function processes the new survey data to determine if it should be added to the list of surveys displayed on the page.
   */
  private subscribeRealtime() {
    this.channel = this.supabaseService.supabase
      .channel('surveys-realtime-all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'surveys' },
        (payload) => {
          const newSurvey = payload.new as any;
          if (!newSurvey.end_date) return;
          const survey: Survey = { id: newSurvey.id, title: newSurvey.title, category: newSurvey.category, endsAt: new Date(newSurvey.end_date) };
          if (this.allSurveys.some(s => s.id === survey.id)) return;
          this.allSurveys = [...this.allSurveys, survey];
          this.cdr.detectChanges();
        }
      )
      .subscribe();
  }

  /**
   * Maps the raw survey data from the database to an array of Survey objects. It takes the data retrieved from the Supabase query and transforms it into a format that matches the Survey interface used in the component. Each survey object includes the id, title, category, and endsAt properties, where endsAt is converted to a Date object for easier manipulation and display in the template. This method is used to prepare the survey data for use within the component after it is fetched from the database.
   */
  private mapToSurveys(data: any[]): Survey[] {
    return data.map(s => ({
      id: s.id,
      title: s.title,
      category: s.category,
      endsAt: new Date(s.end_date)
    }));
  }

  /**
   * Returns a filtered and sorted list of surveys based on the active tab (active or past) and the selected category. The getter filters the allSurveys array to include only surveys that are either active (ending in the future) or past (already ended) based on the activeTab value. If a category is selected, it further filters the surveys to include only those that match the selected category. Finally, it sorts the surveys by their end date, showing active surveys in ascending order (soonest ending first) and past surveys in descending order (most recently ended first). This getter is used in the template to display the appropriate list of surveys based on user interaction with the tabs and category filters.
   */
  get surveys(): Survey[] {
    const now = new Date();
    let filtered = this.allSurveys.filter(s =>
      this.activeTab === 'active' ? s.endsAt >= now : s.endsAt < now
    );
    if (this.selectedCategory) {
      filtered = filtered.filter(s => s.category === this.selectedCategory);
    }
    return filtered.sort((a, b) =>
      this.activeTab === 'active' ? a.endsAt.getTime() - b.endsAt.getTime() : b.endsAt.getTime() - a.endsAt.getTime()
    );
  }

  /**
   * Calculates the number of days left until a survey ends based on its end date. It takes the endsAt property of a survey, which is a Date object, and calculates the difference in time between the current date and the end date. The difference is then converted from milliseconds to days and rounded up to the nearest whole number using Math.ceil.
   */
  getDaysLeft(endsAt: Date): number {
    const diff = endsAt.getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  }

  /**
   * Sets the active tab to either 'active' or 'past' based on user selection. This method is called when a user clicks on one of the tabs to switch between viewing active surveys (those that are still open for participation) and past surveys (those that have already ended). It updates the activeTab property, which in turn triggers the surveys getter to return the appropriate list of surveys for display. Additionally, it resets the selected category filter to null when switching tabs to ensure that the category filter does not persist across different survey lists.
   */
  setTab(tab: 'active' | 'past') {
    this.activeTab = tab;
    this.selectedCategory = null;
  }

  /**
   * Toggles the visibility of the sort options dropdown.
   */
  toggleSort() { this.sortOpen = !this.sortOpen; }

  /**
   * Sets the selected category for filtering surveys. If the same category is clicked again, it deselects it by setting selectedCategory to null.
   */
  selectCategory(cat: string) {
    this.selectedCategory = this.selectedCategory === cat ? null : cat;
    this.sortOpen = false;
  }

  /**
   * Navigates to the survey detail page when a survey card is clicked. It takes the survey ID as a parameter and uses the Angular Router to navigate to the corresponding survey page.
   */
  openSurvey(id: string) {
    this.router.navigate(['/survey', id]);
  }

  /**
   * Closes the sort options dropdown when a click occurs outside of the component. The HostListener listens for click events on the entire document, and if the click target is not within the component's element, it sets sortOpen to false, effectively closing the dropdown.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
    this.sortOpen = false;
    }
  }
}
import { Component, ElementRef, HostListener, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Supabase } from '../../../supabase';

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
export class SurveyListAllComponent implements OnInit {

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

  /**
   * Loads all surveys with an end date on init.
   */
  async ngOnInit() {
    const { data } = await this.supabaseService.supabase
      .from('surveys')
      .select('id, title, category, end_date')
      .not('end_date', 'is', null);
    if (!data) return;
    this.allSurveys = this.mapToSurveys(data);
    this.cdr.detectChanges();
  }

  /**
   * Maps raw Supabase rows to Survey objects.
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
   * Returns surveys filtered by active/past tab and selected category, sorted by end date.
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
   * Returns the number of days remaining (negative if past).
   */
  getDaysLeft(endsAt: Date): number {
    const diff = endsAt.getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  }

  /**
   * Switches between active and past tab and resets category filter.
   */
  setTab(tab: 'active' | 'past') {
    this.activeTab = tab;
    this.selectedCategory = null;
  }

  /**
   * Toggles the sort dropdown open state.
   */
  toggleSort() { this.sortOpen = !this.sortOpen; }

  /**
   * Selects or deselects a category filter. If the same category is clicked again, it will be deselected. Closes the sort dropdown after selection.
   */
  selectCategory(cat: string) {
    this.selectedCategory = this.selectedCategory === cat ? null : cat;
    this.sortOpen = false;
  }

  /**
   * Navigates to the survey detail page when an active survey card is clicked. Past surveys are not clickable.
   */
  openSurvey(id: string) {
    this.router.navigate(['/survey', id]);
  }

  /**
   * Closes the sort dropdown if a click occurs outside of it. This is necessary because the dropdown is not a separate component and we want to close it when clicking anywhere else on the page.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.sortOpen = false;
    }
  }
}
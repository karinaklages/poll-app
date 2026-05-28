import { Component, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
export class SurveyListAllComponent {

  readonly categories = [
    'Team Activities',
    'Health & Wellness',
    'Gaming & Entertainment',
    'Education & Learning',
    'Lifestyle & Preferences',
    'Technology & Innovation',
  ];

  // Later: Supabase Call
  private readonly allSurveys: Survey[] = [
    { id: '1', category: 'Team Activities', title: "Let's plan the next team event together", endsAt: new Date(Date.now() + 1 * 86400000) },
    { id: '2', category: 'Gaming & Entertainment', title: 'Gaming habits and favorite games', endsAt: new Date(Date.now() + 3 * 86400000) },
    { id: '3', category: 'Gaming & Entertainment', title: 'Gaming habits and favorite games', endsAt: new Date(Date.now() + 3 * 86400000) },
    { id: '4', category: 'Health & Wellness', title: 'Healthier future: Fit and wellness survey', endsAt: new Date(Date.now() + 2 * 86400000) },
    { id: '5', category: 'Health & Wellness', title: 'Healthier future: Fit and wellness survey', endsAt: new Date(Date.now() - 2 * 86400000) },
    { id: '6', category: 'Team Activities', title: "Let's plan the next team event together", endsAt: new Date(Date.now() - 5 * 86400000) },
  ];

  activeTab: 'active' | 'past' = 'active';
  sortOpen = false;
  selectedCategory: string | null = null;

  constructor(private elementRef: ElementRef, private router: Router) {}

  get surveys(): Survey[] {
    const now = new Date();

    let filtered = this.allSurveys.filter(s =>
      this.activeTab === 'active' ? s.endsAt >= now : s.endsAt < now
    );

    if (this.selectedCategory) {
      filtered = filtered.filter(s => s.category === this.selectedCategory);
    }

    return filtered.sort((a, b) =>
      this.activeTab === 'active'
        ? a.endsAt.getTime() - b.endsAt.getTime()
        : b.endsAt.getTime() - a.endsAt.getTime()
    );
  }

  getDaysLeft(endsAt: Date): number {
    const diff = endsAt.getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  }

  setTab(tab: 'active' | 'past') {
    this.activeTab = tab;
    this.selectedCategory = null;
  }

  toggleSort() { this.sortOpen = !this.sortOpen; }

  selectCategory(cat: string) {
    this.selectedCategory = this.selectedCategory === cat ? null : cat;
    this.sortOpen = false;
  }

  openSurvey(id: string) {
    this.router.navigate(['/survey', id]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.sortOpen = false;
    }
  }
}
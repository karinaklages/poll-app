import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Survey {
  id: string;
  category: string;
  title: string;
  endsInDays: number;
}

@Component({
  selector: 'app-survey-list-all',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './survey-list-all.component.html',
  styleUrl: './survey-list-all.component.scss'
})
export class SurveyListAllComponent {
  activeTab: 'active' | 'past' = 'active';
  sortOpen = false;
  selectedCategory: string | null = null;

  surveys: Survey[] = [
    { id: '1', category: 'Team Activities', title: "Let's plan the next team event together", endsInDays: 1 },
    { id: '2', category: 'Gaming & Entertainment', title: 'Gaming habits and favorite games', endsInDays: 3 },
    { id: '3', category: 'Gaming & Entertainment', title: 'Gaming habits and favorite games', endsInDays: 3 },
    { id: '4', category: 'Health & Wellness', title: 'Healthier future: Fit and wellness survey', endsInDays: 2 },
    { id: '5', category: 'Health & Wellness', title: 'Healthier future: Fit and wellness survey', endsInDays: 2 },
    { id: '6', category: 'Team Activities', title: "Let's plan the next team event together", endsInDays: 1 },
  ];

  categories = [
    'Team Activities',
    'Health & Wellness',
    'Gaming & Entertainment',
    'Education & Learning',
    'Lifestyle & Preferences',
    'Technology & Innovation',
  ];

  setTab(tab: 'active' | 'past') { this.activeTab = tab; }
  toggleSort() { this.sortOpen = !this.sortOpen; }
  selectCategory(cat: string) { this.selectedCategory = cat; this.sortOpen = false; }
}
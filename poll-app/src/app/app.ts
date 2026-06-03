import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Supabase } from './supabase';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  databaseService = inject(Supabase)
  protected readonly title = signal('poll-app');

  ngOnInit() {
    this.databaseService.getSurveys()
  }
}
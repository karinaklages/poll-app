import { Component, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-hero',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './hero.component.html',
    styleUrl: './hero.component.scss'
})
export class HeroComponent {
    @Output() openNewSurvey = new EventEmitter<void>();

    clicked = false;
    hovered = false;

    onMouseEnter() { this.hovered = true; }
    onMouseLeave() { this.hovered = false; this.clicked = false; }
    onSurveyClick() {
        this.clicked = true;
        this.openNewSurvey.emit();
    }
}
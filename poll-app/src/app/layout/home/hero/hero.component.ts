import { Component } from '@angular/core';

@Component({
    selector: 'app-hero',
    standalone: true,
    templateUrl: './hero.component.html',
    styleUrl: './hero.component.scss'
})
export class HeroComponent {
    clicked = false;
    hovered = false;

    onMouseEnter() { this.hovered = true; }
    onMouseLeave() { this.hovered = false; this.clicked = false; }
    onSurveyClick() { this.clicked = true; }
}
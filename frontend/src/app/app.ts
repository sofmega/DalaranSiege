import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  aboutOpen = false;

  toggleAbout(): void {
    this.aboutOpen = !this.aboutOpen;
  }

  closeAbout(): void {
    this.aboutOpen = false;
  }

  @HostListener('document:keydown.escape')
  closeAboutOnEscape(): void {
    this.closeAbout();
  }
}

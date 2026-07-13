import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isAboutOpen = false;

  toggleAbout(): void {
    this.isAboutOpen = !this.isAboutOpen;
  }

  closeAbout(): void {
    this.isAboutOpen = false;
  }
}

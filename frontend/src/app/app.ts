import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';

interface HelloResponse {
  message: string;
  timestamp: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly http = inject(HttpClient);

  protected readonly apiMessage = signal('Checking backend...');
  protected readonly apiTimestamp = signal('');

  constructor() {
    this.http.get<HelloResponse>('/api/hello').subscribe({
      next: (response) => {
        this.apiMessage.set(response.message);
        this.apiTimestamp.set(`Last response: ${response.timestamp}`);
      },
      error: () => {
        this.apiMessage.set('Backend is not reachable yet');
        this.apiTimestamp.set('Start Spring Boot on port 8080, then refresh Angular.');
      }
    });
  }
}

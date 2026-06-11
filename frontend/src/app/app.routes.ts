import { Routes } from '@angular/router';
import { HeroBuildComponent } from './hero-build.component';
import { HomeComponent } from './home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'heroes/:id/build', component: HeroBuildComponent },
  { path: '**', redirectTo: '' }
];

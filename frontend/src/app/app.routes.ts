import { Routes } from '@angular/router';
import { AuthComponent } from './auth.component';
import { HeroBuildComponent } from './hero-build.component';
import { HomeComponent } from './home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'heroes/:id/build', component: HeroBuildComponent },
  { path: '**', redirectTo: '' }
];

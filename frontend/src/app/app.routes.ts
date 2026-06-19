import { Routes } from '@angular/router';
import { AuthComponent } from './auth.component';
import { BuildDetailComponent } from './build-detail.component';
import { HeroBuildComponent } from './hero-build.component';
import { HomeComponent } from './home.component';
import { ItemDetailComponent } from './item-detail.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'items/:id', component: ItemDetailComponent },
  { path: 'heroes/:id/build', component: HeroBuildComponent },
  { path: 'heroes/:heroId/builds/:buildId', component: BuildDetailComponent },
  { path: '**', redirectTo: '' }
];

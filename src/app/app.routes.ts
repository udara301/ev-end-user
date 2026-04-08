import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { SearchComponent } from './pages/search/search.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { BookingSummaryComponent } from './pages/booking-summary/booking-summary.component';
import { AuthGuard } from './guards/auth.guard';
import { ChargingNetworkComponent } from './pages/charging-network/charging-network.component';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
	{ path: 'login', component: LoginComponent },
	{ path: 'signup', component: SignupComponent },
    { path: 'dashboard', canActivate: [AuthGuard], component: DashboardComponent },
    { path: 'search', component: SearchComponent },
    { path: 'booking-summary', component: BookingSummaryComponent },
    { path: 'charging-stations', component: ChargingNetworkComponent },
    { path: '**', redirectTo: '' }
];

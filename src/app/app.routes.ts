
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { SearchComponent } from './pages/search/search.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { BookingSummaryComponent } from './pages/booking-summary/booking-summary.component';
import { BookingSuccessComponent } from './pages/booking-success/booking-success.component';
import { BookingCancelComponent } from './pages/booking-cancel/booking-cancel.component';
import { AuthGuard } from './guards/auth.guard';
import { ChargingNetworkComponent } from './pages/charging-network/charging-network.component';
import { QuickSearchComponent } from './pages/quick-search/quick-search.component';
import { TermsComponent } from './pages/legal/terms.component';
import { PrivacyPolicyComponent } from './pages/legal/privacy-policy.component';
import { ReturnPolicyComponent } from './pages/legal/return-policy.component';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'dashboard', canActivate: [AuthGuard], component: DashboardComponent },
    { path: 'search', component: SearchComponent },
    { path: 'booking-summary', component: BookingSummaryComponent },
    { path: 'booking-success', component: BookingSuccessComponent },
    { path: 'booking-cancel', component: BookingCancelComponent },
    { path: 'charging-stations', component: ChargingNetworkComponent },
    { path: 'quick-search/:ocppId', component: QuickSearchComponent },
    { path: 'terms', component: TermsComponent },
    { path: 'privacy-policy', component: PrivacyPolicyComponent },
    { path: 'return-policy', component: ReturnPolicyComponent },
    { path: '**', redirectTo: '' }
];


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

// Standalone blog post view


import { PlanJourneyComponent } from './pages/plan-journey/plan-journey.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { SingleBlogPostComponent } from './components/blog-section/single-blog-post.component';
import { AffiliateSignupComponent } from './pages/affiliate-signup/affiliate-signup.component';
import { AffiliateLoginComponent } from './pages/affiliate-login/affiliate-login.component';
import { AffiliateDashboardComponent } from './pages/affiliate-dashboard/affiliate-dashboard.component';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
    { path: 'blog/:id', component: SingleBlogPostComponent },
    { path: 'plan-journey', component: PlanJourneyComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'login', component: LoginComponent },
    { path: 'affiliate/login', component: AffiliateLoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'become-affiliate', component: AffiliateSignupComponent },
    { path: 'affiliate/signup', component: AffiliateSignupComponent },
    { path: 'affiliate/dashboard', canActivate: [AuthGuard], component: AffiliateDashboardComponent },
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

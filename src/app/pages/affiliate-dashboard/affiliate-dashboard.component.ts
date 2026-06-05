import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AffiliateProfileTabComponent } from './affiliate-profile-tab/affiliate-profile-tab.component';
import { CodeTabComponent } from './code-tab/code-tab.component';
import { OverviewTabComponent } from './overview-tab/overview-tab.component';
import { PointsTabComponent } from './points-tab/points-tab.component';
import { RedeemTabComponent } from './redeem-tab/redeem-tab.component';

type AffiliateTabId = 'overview' | 'codes' | 'points' | 'redeem' | 'profile';

interface AffiliateTab {
  id: AffiliateTabId;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-affiliate-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    OverviewTabComponent,
    CodeTabComponent,
    PointsTabComponent,
    RedeemTabComponent,
    AffiliateProfileTabComponent
  ],
  templateUrl: './affiliate-dashboard.component.html',
  styleUrl: './affiliate-dashboard.component.scss'
})
export class AffiliateDashboardComponent implements OnInit {
  activeTab: AffiliateTabId = 'overview';
  affiliateName = 'Affiliate Partner';

  readonly tabs: AffiliateTab[] = [
    { id: 'overview', label: 'Overview', icon: 'insights' },
    { id: 'codes', label: 'Affiliate Codes', icon: 'qr_code_2' },
    { id: 'points', label: 'Points', icon: 'stars' },
    { id: 'redeem', label: 'Redeem Cards', icon: 'redeem' },
    { id: 'profile', label: 'Profile', icon: 'person' }
  ];

  constructor(private readonly authService: AuthService, private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab && this.tabs.some((t) => t.id === tab)) {
      this.activeTab = tab as AffiliateTabId;
    }

    this.authService.getProfile().subscribe({
      next: (data: any) => {
        this.affiliateName = data?.name || 'Affiliate Partner';
      },
      error: () => {
        this.affiliateName = 'Affiliate Partner';
      }
    });
  }

  setTab(tab: AffiliateTabId): void {
    this.activeTab = tab;
  }
}

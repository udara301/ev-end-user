import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { BookingsTabComponent } from './bookings-tab/bookings-tab.component';
import { ChargerControlsTabComponent } from './charger-controls-tab/charger-controls-tab.component';
import { WalletTabComponent } from './wallet-tab/wallet-tab.component';
import { ProfileTabComponent } from './profile-tab/profile-tab.component';

type TabId = 'bookings' | 'charger' | 'wallet' | 'profile';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BookingsTabComponent,
    ChargerControlsTabComponent,
    WalletTabComponent,
    ProfileTabComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  activeTab: TabId = 'bookings';
  userName = '';

  readonly tabs: Tab[] = [
    { id: 'bookings', label: 'Bookings', icon: 'directions_car' },
    { id: 'charger', label: 'Charger Controls', icon: 'ev_station' },
    { id: 'wallet', label: 'Wallet', icon: 'account_balance_wallet' },
    { id: 'profile', label: 'Profile', icon: 'person' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const userData = this.authService.getProfile().subscribe(
      (data:any) => {
        this.userName = data?.name || 'there';
      }
    );
    // console.log('User profile data:', userData);  
    // const user = this.authService.getUserFromToken();
    // this.userName = userData?.name || 'there';
  }

  setTab(tab: TabId): void {
    this.activeTab = tab;
  }
}

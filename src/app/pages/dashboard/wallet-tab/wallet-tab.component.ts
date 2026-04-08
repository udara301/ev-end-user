import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface WalletTransaction {
  id: string;
  title: string;
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  icon: string;
}

@Component({
  selector: 'app-wallet-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wallet-tab.component.html'
})
export class WalletTabComponent {
  balance = 0;
  chargeCredits = 0;
  transactions: WalletTransaction[] = [];
  isLoading = false;
}

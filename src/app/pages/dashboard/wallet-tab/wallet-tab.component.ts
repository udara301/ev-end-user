import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService, WalletTransaction, TopupResponse } from '../../../services/wallet.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-wallet-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet-tab.component.html'
})
export class WalletTabComponent implements OnInit {
  balance = 0;
  transactions: WalletTransaction[] = [];
  isLoading = true;

  showTopupModal = false;
  topupAmount: number | null = null;
  topupError = '';
  isTopupProcessing = false;

  readonly quickAmounts = [500, 1000, 2000, 5000];

  constructor(
    private walletService: WalletService,
    private authService: AuthService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadWalletData();
  }

  loadWalletData(): void {
    this.isLoading = true;
    this.walletService.getBalance().subscribe({
      next: (res) => {
        this.balance = res.balance;
      },
      error: () => {}
    });

    this.walletService.getTransactions().subscribe({
      next: (txs) => {
        this.transactions = txs;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  openTopup(): void {
    this.topupAmount = null;
    this.topupError = '';
    this.showTopupModal = true;
  }

  closeTopup(): void {
    if (this.isTopupProcessing) return;
    this.showTopupModal = false;
  }

  selectQuickAmount(amount: number): void {
    this.topupAmount = amount;
    this.topupError = '';
  }

  confirmTopup(): void {
    if (!this.topupAmount || this.topupAmount < 100) {
      this.topupError = 'Minimum top-up amount is Rs 100';
      return;
    }

    this.isTopupProcessing = true;
    this.topupError = '';

    this.walletService.initiateTopup(this.topupAmount).subscribe({
      next: (topupRes) => {
        this.showTopupModal = false;
        this.startPayHere(topupRes);
      },
      error: (err) => {
        this.isTopupProcessing = false;
        this.topupError = err?.error?.message || 'Failed to initiate top-up. Please try again.';
      }
    });
  }

  private startPayHere(topupRes: TopupResponse): void {
    const user = this.authService.getUserFromToken();
    const fullName = (user?.name || 'Customer').split(' ');

    this.walletService.startTopupPayment(
      topupRes,
      {
        first_name: fullName[0] || 'Customer',
        last_name: fullName.slice(1).join(' ') || '-',
        email: user?.email || '',
        phone: user?.phone || '',
        address: '-',
        city: 'Colombo',
        country: 'Sri Lanka',
      },
      {
        onCompleted: () => {
          this.ngZone.run(() => {
            this.isTopupProcessing = false;
            this.showTopupModal = false;
            this.loadWalletData();
          });
        },
        onDismissed: () => {
          this.ngZone.run(() => {
            this.isTopupProcessing = false;
            this.topupError = 'Payment was cancelled. You can retry.';
          });
        },
        onError: (error: string) => {
          this.ngZone.run(() => {
            this.isTopupProcessing = false;
            this.topupError = 'Payment failed: ' + error;
          });
        },
      }
    );
  }

  getTxIcon(type: string): string {
    switch (type) {
      case 'topup': return 'add_circle';
      case 'payment': return 'shopping_cart';
      case 'refund': return 'replay';
      default: return 'swap_horiz';
    }
  }

  getTxType(type: string): 'credit' | 'debit' {
    return type === 'topup' || type === 'refund' ? 'credit' : 'debit';
  }
}

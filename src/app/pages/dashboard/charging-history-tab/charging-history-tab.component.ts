import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ChargerService } from '../../../services/charger.service';

interface ChargeHistoryItem {
  charge_id: number;
  charger_id: number;
  connector_id: number;
  start_time: string;
  end_time: string | null;
  meter_start: number | string | null;
  meter_stop: number | string | null;
  amount: number | string | null;
  status: string;
  vehicle_number: string | null;
  ocpp_transaction_id: string | null;
  note: string | null;
  ocpp_id: string;
  location: string;
  street_name: string;
  city: string;
  price_per_kwh: number | string | null;
  charger_type_model: string | null;
  current_type: string | null;
  connector_type: string | null;
  max_power_kw: number | string | null;
  duration_seconds: number | null;
}

@Component({
  selector: 'app-charging-history-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './charging-history-tab.component.html'
})
export class ChargingHistoryTabComponent implements OnInit {
  history: ChargeHistoryItem[] = [];
  isLoading = true;
  errorMessage = '';

  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 1;

  constructor(private chargerService: ChargerService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(page = this.page): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.chargerService.getChargeHistory(page, this.pageSize).subscribe({
      next: (res) => {
        this.history = res?.history || [];
        this.page = res?.page || page;
        this.pageSize = res?.limit || this.pageSize;
        this.total = res?.total || 0;
        this.totalPages = Math.max(res?.total_pages || 1, 1);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load charging history.';
        this.history = [];
        this.isLoading = false;
      }
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.loadHistory(page);
  }

  get totalEnergyKwh(): number {
    return this.history.reduce((sum, item) => sum + this.getEnergyUsed(item), 0);
  }

  get totalAmount(): number {
    return this.history.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }

  get currentPageSessions(): number {
    return this.history.length;
  }

  getEnergyUsed(item: ChargeHistoryItem): number {
    const meterStart = Number(item.meter_start || 0);
    const meterStop = Number(item.meter_stop || 0);
    const diff = meterStop - meterStart;
    return diff > 0 ? diff : 0;
  }

  formatDuration(seconds: number | null): string {
    if (!seconds || seconds <= 0) return '-';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }

    return `${minutes}m ${remainingSeconds}s`;
  }

  getStatusClasses(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700';
      case 'STOPPED':
        return 'bg-amber-50 text-amber-700';
      case 'CHARGING':
        return 'bg-cyan-50 text-cyan-700';
      case 'FAILED':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }
}
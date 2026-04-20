import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChargerService } from '../../../services/charger.service';
import { ToastService } from '../../../services/toast.service';
import { WebSocketService } from '../../../services/websocket.service';
import { Subscription } from 'rxjs';

interface Connector {
  id: number;
  connector_id: number;
  status: string;
  connector_type: string;
  max_power_kw: string;
  output_voltage: string;
  amperage: string | null;
  durationMs?: number;
  energyUsed?: number;
  amount?: number;
}

interface Charger {
  id: number;
  ocpp_id: string;
  serial_number: string;
  checksum: string;
  status: string;
  location: string;
  street_name: string;
  city: string;
  price_per_kwh: string;
  agent_id: number;
  created_at: string;
  charger_type_model: string;
  current_type: string;
  connectors: Connector[];
}

@Component({
  selector: 'app-charger-controls-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './charger-controls-tab.component.html'
})
export class ChargerControlsTabComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  isLoading = false;
  searchResult: Charger | null = null;
  activeSession: any = null;
  chargingConnectorIds = new Set<number>();
  private wsSubscription?: Subscription;

  // Live meter data for active session
  liveDurationMs = 0;
  liveEnergyUsed = 0;
  liveAmount = 0;

  constructor(
    private chargerService: ChargerService,
    private toast: ToastService,
    private webSocketService: WebSocketService
  ) {}

  // QR Scanner
  isScanning = false;
  scanError = '';
  manualChargerId = '';
  private stream: MediaStream | null = null;
  private scanInterval: any = null;

  // Quick actions
  readonly nearbyLink = '/charging-network';

  ngOnInit(): void {
    this.checkActiveSession();
    this.connectWebSocket();
  }

  private connectWebSocket(): void {
    console.log('Connecting to WebSocket for charger updates...');
    this.wsSubscription = this.webSocketService.connect().subscribe((message) => {
      if (message?.type === 'charging_started') {
        this.checkActiveSession();
      } else if (message?.type === 'charging_stopped') {
        this.activeSession = null;
        this.liveDurationMs = 0;
        this.liveEnergyUsed = 0;
        this.liveAmount = 0;
        if (this.searchResult) {
          this.chargerService.search(this.searchResult.ocpp_id).subscribe({
            next: (result) => {
              if (result?.ocpp_id) this.searchResult = result;
            }
          });
        }
      } else if (message?.type === 'meter_update') {
        // Update active session live data
        if (this.activeSession &&
            this.activeSession.charger_id?.toString() === message.chargerId?.toString() &&
            this.activeSession.connector_id?.toString() === message.connectorId?.toString()) {
          this.liveDurationMs = message.durationMs || 0;
          this.liveEnergyUsed = message.energyUsed || 0;
          this.liveAmount = message.amount || 0;
        }
        // Update search result connector live data
        if (this.searchResult && this.searchResult.id?.toString() === message.chargerId?.toString()) {
          this.searchResult = {
            ...this.searchResult,
            connectors: this.searchResult.connectors.map(c => {
              if (c.connector_id?.toString() === message.connectorId?.toString()) {
                return { ...c, durationMs: message.durationMs || 0, energyUsed: message.energyUsed || 0, amount: message.amount || 0 };
              }
              return c;
            })
          };
        }
      }
    });
  }

  private checkActiveSession(): void {
    this.chargerService.getActiveSession().subscribe({
      next: (res) => {
        this.activeSession = res?.active_session || null;
        if (!this.activeSession) {
          this.handlePendingCharger();
        }
      },
      error: () => {
        this.handlePendingCharger();
      }
    });
  }

  private handlePendingCharger(): void {
    const pendingCharger = localStorage.getItem('ev_pending_charger');
    if (pendingCharger) {
      localStorage.removeItem('ev_pending_charger');
      if (this.activeSession) {
        this.toast.error('You already have an ongoing charging session.');
      } else {
        this.onChargerIdentified(pendingCharger);
      }
    }
  }

  ngOnDestroy(): void {
    this.stopScanner();
    this.wsSubscription?.unsubscribe();
    this.webSocketService.disconnect();
  }

  async startScanner(): Promise<void> {
    this.scanError = '';
    this.isScanning = true;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      // Wait for the video element to be rendered
      setTimeout(() => {
        if (this.videoElement?.nativeElement && this.stream) {
          const video = this.videoElement.nativeElement;
          video.srcObject = this.stream;
          video.play();
          this.startDetection(video);
        }
      }, 100);
    } catch {
      this.scanError = 'Camera access denied. Please allow camera permission or enter the charger ID manually.';
      this.isScanning = false;
    }
  }

  private startDetection(video: HTMLVideoElement): void {
    if (!('BarcodeDetector' in window)) {
      // Fallback: browser doesn't support BarcodeDetector
      this.scanError = 'QR scanning is not supported on this browser. Please enter the charger ID manually.';
      this.stopScanner();
      return;
    }

    const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });

    this.scanInterval = setInterval(async () => {
      if (video.readyState < 2) return;
      try {
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0) {
          const value = barcodes[0].rawValue;
          this.stopScanner();
          this.onChargerIdentified(value);
        }
      } catch {
        // detection frame error, continue scanning
      }
    }, 300);
  }

  stopScanner(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.isScanning = false;
  }

  submitManualId(): void {
    const id = this.manualChargerId.trim();
    if (!id) return;
    if (this.activeSession) {
      this.toast.error('You already have an ongoing charging session.');
      return;
    }
    this.onChargerIdentified(id);
  }

  private onChargerIdentified(chargerId: string): void {
    this.manualChargerId = '';
    if (this.activeSession) {
      this.toast.error('You already have an ongoing charging session.');
      return;
    }
    this.isLoading = true;

    this.chargerService.search(chargerId).subscribe({
      next: (result) => {
        if (result?.ocpp_id) {
          this.searchResult = result;
        } else {
          this.toast.error(result?.message || 'Charger not found.');
          this.searchResult = null;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Something went wrong. Please try again.');
        this.isLoading = false;
      }
    });
  }

  startCharging(connector: Connector): void {
    if (!this.searchResult) return;
    this.chargingConnectorIds.add(connector.id);

    this.chargerService.startCharging(this.searchResult.id, connector.connector_id).subscribe({
      next: () => {
        connector.status = 'CHARGING';
      },
      error: (err) => {
        this.chargingConnectorIds.delete(connector.id);
        this.toast.error(err.error?.message || 'Failed to start charging.');
      }
    });
  }

  stopCharging(connector: Connector): void {
    if (!this.searchResult) return;

    this.chargerService.stopCharging(this.searchResult.id, connector.connector_id).subscribe({
      next: () => {
        this.chargingConnectorIds.delete(connector.id);
        connector.status = 'AVAILABLE';
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to stop charging.');
      }
    });
  }

  isConnectorCharging(connector: Connector): boolean {
    return this.chargingConnectorIds.has(connector.id);
  }

  stopActiveSession(): void {
    if (!this.activeSession) return;
    const { charger_id, connector_id } = this.activeSession;

    this.chargerService.stopCharging(charger_id, connector_id).subscribe({
      next: () => {
        this.toast.success('Charging session stopped successfully.');
        this.activeSession = null;
        this.liveDurationMs = 0;
        this.liveEnergyUsed = 0;
        this.liveAmount = 0;
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to stop charging session.');
      }
    });
  }

  clearSearch(): void {
    this.searchResult = null;
  }

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'CHARGING': return 'text-cyan-600 bg-cyan-50 border-cyan-200';
      case 'FAULTED': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  }

  formatDuration(ms: number): string {
    if (!ms) return '0m 0s';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  }
}

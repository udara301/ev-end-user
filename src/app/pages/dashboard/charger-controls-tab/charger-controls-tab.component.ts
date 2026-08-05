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
  durationSeconds?: number;
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
  // chargingConnectorIds = new Set<number>();
  processingConnectorIds = new Set<number>(); // This set is used to avoid mulitple clicks while request handling
  isStoppingActiveSession = false;
  private wsSubscription?: Subscription;
  private durationTimerId: ReturnType<typeof setInterval> | null = null;
  private isComponentDestroyed = false;

  // Live meter data for active session
  liveDurationSeconds = 0;
  liveEnergyUsed = 0;
  liveAmount = 0;

  constructor(
    private chargerService: ChargerService,
    private toast: ToastService,
    private webSocketService: WebSocketService
  ) { }

  // QR Scanner
  isScanning = false;
  scanError = '';
  manualChargerId = '';
  private stream: MediaStream | null = null;
  private scanInterval: any = null;
  private canvasContext: CanvasRenderingContext2D | null = null;
  private jsQRLoaded = false;

  // Quick actions
  readonly nearbyLink = '/charging-network';
  readonly chargingHistoryLink = '/dashboard';

  ngOnInit(): void {
    this.checkActiveSessionOrRequestedSession();
    this.connectWebSocket();
  }

  // THERE ARE THREE METHOD FOR SEARCHING CHARGER
  // 1. Serach Charger manually
  // 2. Scan QR Code from the charger controller page
  // 3. Scan QR Code from the phone camera app and redirect to the charger control page.

  private connectWebSocket(): void {
    console.log('Connecting to WebSocket for charger updates...');
    this.wsSubscription = this.webSocketService.connect().subscribe((message) => {

      if (message?.type === 'charging_started') {
        // updating the status of the connectors by requesting the actual active session from the db
        this.getActiveSessionDetails();
        this.toast.success('Charging session started.');
      } else if (message?.type === 'charging_stopped') {
        this.activeSession = null;
        this.liveDurationSeconds = 0;
        this.liveEnergyUsed = 0;
        this.liveAmount = 0;
        this.stopDurationTimer();
        this.getActiveSessionDetails();
      } else if (message?.type === 'meter_update') {
        // Update active session live data
        if (this.activeSession &&
          this.activeSession.charger_id?.toString() === message.chargerId?.toString() &&
          this.activeSession.connector_id?.toString() === message.connectorId?.toString()) {
          this.liveDurationSeconds = message.durationSeconds ?? this.liveDurationSeconds;
          this.liveEnergyUsed = message.energyUsed || 0;
          this.liveAmount = message.amount || 0;
          this.startDurationTimer();
        }
        // Update search result connector live data
        if (this.searchResult && this.searchResult.id?.toString() === message.chargerId?.toString()) {
          this.searchResult = {
            ...this.searchResult,
            connectors: this.searchResult.connectors.map(c => {
              if (c.connector_id?.toString() === message.connectorId?.toString()) {
                return {
                  ...c,
                  durationSeconds: message.durationSeconds ?? c.durationSeconds ?? 0,
                  energyUsed: message.energyUsed || 0,
                  amount: message.amount || 0
                };
              }
              return c;
            })
          };
        }
      } else if (message?.type === 'connector_status_updated') {
        if (this.searchResult && this.searchResult.id?.toString() === message.chargerId?.toString()) {
          this.searchResult = {
            ...this.searchResult,
            connectors: this.searchResult.connectors.map(c => {
              if (message.connectorId == null) {
                return { ...c, status: message.status || c.status };
              }
              if (c.connector_id?.toString() === message.connectorId?.toString()) {
                return { ...c, status: message.status || c.status };
              }
              return c;
            })
          };
        }
      }
    });
  }

  private checkActiveSessionOrRequestedSession(): void {
    this.chargerService.getActiveSession().subscribe({
      next: (res) => {
        this.activeSession = res?.active_session || null;
        if (this.activeSession) {
          this.bootstrapLiveDuration();
          this.startDurationTimer();
          this.liveEnergyUsed = (this.activeSession.meter_stop - this.activeSession.meter_start)/1000 || 0;
          this.liveAmount = this.activeSession.est_cost || 0;
          this.toast.info('You have an active charging session.');
        }
        else {
          this.stopDurationTimer();
          this.handleRequestedChargerSearch(); // to load searched charger via qr code directly
        }
      },
      error: () => {
        this.handleRequestedChargerSearch();
      }
    });
  }

  private getActiveSessionDetails(): void {
    this.chargerService.getActiveSession().subscribe({
      next: (res) => {
        const session = res?.active_session || null;
        this.activeSession = session;

        if (session) {
          this.bootstrapLiveDuration();
          this.startDurationTimer();
        } else {
          this.stopDurationTimer();
        }

        if (
          this.searchResult &&
          this.activeSession &&
          this.searchResult.id?.toString() === this.activeSession.charger_id?.toString()
        ) {
          this.searchResult = {
            ...this.searchResult,
            connectors: this.searchResult.connectors.map(c => {
              if (c.connector_id?.toString() === this.activeSession.connector_id?.toString()) {
                return { ...c, status: this.activeSession.status || 'CHARGING' };
              }
              return c;
            })
          };
        }
      },
      error: () => {
        this.activeSession = null;
        this.stopDurationTimer();
      }
    });
  }

  // ev pending charger flow is used when QR is scanned directly  without logged in
  private handleRequestedChargerSearch(): void {
    const requestedCharger = localStorage.getItem('ev_pending_charger');
    if (requestedCharger) {
      localStorage.removeItem('ev_pending_charger');
      this.searchChargerFromId(requestedCharger);
    }
  }

  ngOnDestroy(): void {
    this.stopScanner();
    this.stopDurationTimer();
    this.isComponentDestroyed = true;
    this.wsSubscription?.unsubscribe();
    this.webSocketService.disconnect();
  }

  private bootstrapLiveDuration(): void {
    if (!this.activeSession?.start_time) return;

    const startedAt = new Date(this.activeSession.start_time).getTime();
    if (Number.isNaN(startedAt)) return;

    const now = Date.now();
    this.liveDurationSeconds = Math.max(Math.floor((now - startedAt) / 1000), 0);
  }

  private startDurationTimer(): void {
    if (this.durationTimerId || !this.activeSession) return;

    this.durationTimerId = setInterval(() => {
      if (!this.activeSession) {
        this.stopDurationTimer();
        return;
      }

      this.liveDurationSeconds += 1;
      this.incrementActiveConnectorDuration();
    }, 1000);
  }

  private stopDurationTimer(): void {
    if (!this.durationTimerId) return;

    clearInterval(this.durationTimerId);
    this.durationTimerId = null;
  }

  private incrementActiveConnectorDuration(): void {
    if (!this.searchResult || !this.activeSession) return;
    if (this.searchResult.id?.toString() !== this.activeSession.charger_id?.toString()) return;

    this.searchResult = {
      ...this.searchResult,
      connectors: this.searchResult.connectors.map((c) => {
        if (c.connector_id?.toString() === this.activeSession.connector_id?.toString()) {
          return { ...c, durationSeconds: (c.durationSeconds || 0) + 1 };
        }
        return c;
      })
    };
  }

  private extractChargerIdFromScan(value: string): string {
    const raw = (value || '').trim();
    if (!raw) return '';

    const sanitize = (input: string): string => {
      return input
        .replace(/%22/gi, '')
        .replace(/["']/g, '')
        .replace(/[.,;:!?]+$/g, '')
        .trim();
    };

    try {
      const url = new URL(raw);
      const parts = url.pathname.split('/').filter(Boolean);
      const lastPart = parts.length ? decodeURIComponent(parts[parts.length - 1]) : raw;
      return sanitize(lastPart);
    } catch {
      const parts = raw.split('/').filter(Boolean);
      const lastPart = parts.length ? decodeURIComponent(parts[parts.length - 1]) : raw;
      return sanitize(lastPart);
    }
  }

  async startScanner(): Promise<void> {
    this.scanError = '';
    this.isScanning = true;
    this.isComponentDestroyed = false;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      // Wait for the video element to be rendered
      setTimeout(() => {
        if (this.isComponentDestroyed || !this.videoElement?.nativeElement || !this.stream) {
          return;
        }

        const video = this.videoElement.nativeElement;

        // Verify video element is still in the document
        if (!document.body.contains(video)) {
          this.scanError = 'Video element lost. Please try again.';
          this.stopScanner();
          return;
        }

        video.srcObject = this.stream;
        const playPromise = video.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (!this.isComponentDestroyed) {
                this.startDetection(video);
              }
            })
            .catch((err) => {
              console.warn('Video play error:', err);
              if (err.name === 'AbortError') {
                this.scanError = 'Camera stream was interrupted. Please try again.';
              } else {
                this.scanError = 'Failed to start video. Please try again.';
              }
              this.stopScanner();
            });
        }
      }, 100);
    } catch (err) {
      this.scanError = 'Camera access denied. Please allow camera permission or enter the charger ID manually.';
      this.isScanning = false;
    }
  }

  private startDetection(video: HTMLVideoElement): void {
    // Try to use BarcodeDetector first, fallback to jsQR
    if ('BarcodeDetector' in window) {
      this.startBarcodeDetection(video);
    } else {
      this.startJsQRDetection(video);
    }
  }

  private startBarcodeDetection(video: HTMLVideoElement): void {
    const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });

    this.scanInterval = setInterval(async () => {
      // Check if component is destroyed or video element is no longer in DOM
      if (this.isComponentDestroyed || !document.body.contains(video)) {
        this.stopScanner();
        return;
      }

      if (video.readyState < 2) return;

      try {
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0) {
          const value = this.extractChargerIdFromScan(barcodes[0].rawValue || '');
          this.stopScanner();
          this.searchChargerFromId(value);
        }
      } catch (err) {
        // detection frame error or component destroyed, continue scanning if still active
        if (this.isComponentDestroyed || !this.isScanning) {
          this.stopScanner();
        }
      }
    }, 300);
  }

  private startJsQRDetection(video: HTMLVideoElement): void {
    // Load jsQR library if not already loaded
    if (!this.jsQRLoaded) {
      this.loadJsQRLibrary().then(() => {
        this.startJsQRDetectionLoop(video);
      });
    } else {
      this.startJsQRDetectionLoop(video);
    }
  }

  private loadJsQRLibrary(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).jsQR) {
        this.jsQRLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.onload = () => {
        this.jsQRLoaded = true;
        resolve();
      };
      script.onerror = () => {
        this.scanError = 'Failed to load QR scanner library. Please enter the charger ID manually.';
        this.stopScanner();
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  private startJsQRDetectionLoop(video: HTMLVideoElement): void {
    // Create canvas for frame capture
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      this.scanError = 'Failed to create canvas. Please try again.';
      this.stopScanner();
      return;
    }

    this.canvasContext = ctx;

    this.scanInterval = setInterval(() => {
      // Check if component is destroyed or video element is no longer in DOM
      if (this.isComponentDestroyed || !document.body.contains(video)) {
        this.stopScanner();
        return;
      }

      if (video.readyState < 2) return;

      try {
        // Update canvas size if video dimensions changed
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const jsQR = (window as any).jsQR;
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          const value = this.extractChargerIdFromScan(code.data || '');
          this.stopScanner();
          this.searchChargerFromId(value);
        }
      } catch (err) {
        if (this.isComponentDestroyed || !this.isScanning) {
          this.stopScanner();
        }
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
    if (this.videoElement?.nativeElement) {
      const video = this.videoElement.nativeElement;
      video.srcObject = null;
      video.pause();
    }
    this.isScanning = false;
  }

  // Search by  Charger name manually (ocpp_id)
  submitManualId(): void {
    const id = this.manualChargerId.trim();
    if (!id) return;
    // search for the charger
    this.searchChargerFromId(id);
  }

  private searchChargerFromId(chargerId: string): void {
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
    if (!this.searchResult || this.processingConnectorIds.has(connector.connector_id)) return;

    this.processingConnectorIds.add(connector.connector_id);
    this.chargerService.startCharging(this.searchResult.id, connector.connector_id).subscribe({
      next: () => {
        connector.status = 'PENDING';
        this.processingConnectorIds.delete(connector.connector_id);
      },
      error: (err) => {
        this.processingConnectorIds.delete(connector.connector_id);
        if (this.searchResult) {
          this.searchChargerFromId(this.searchResult.ocpp_id); // refresh charger details to get the actual connector status from backend
        }
        this.toast.error(err.error?.message || 'Failed to start charging.');
      }
    });
  }

  stopCharging(connector: Connector): void {
    if (!this.searchResult || this.processingConnectorIds.has(connector.connector_id)) return;

    this.processingConnectorIds.add(connector.connector_id);
    this.chargerService.stopCharging(this.searchResult.id, connector.connector_id).subscribe({
      next: () => {
        // this.chargingConnectorIds.delete(connector.id);
        connector.status = 'PENDING';
        this.processingConnectorIds.delete(connector.connector_id);
      },
      error: (err) => {
        this.processingConnectorIds.delete(connector.connector_id);
        this.toast.error(err.error?.message || 'Failed to stop charging.');
      }
    });
  }

  // isConnectorCharging(connector: Connector): boolean {
  //   return this.chargingConnectorIds.has(connector.id);
  // }

  isConnectorProcessing(connector: Connector): boolean {
    return this.processingConnectorIds.has(connector.connector_id);
  }

  isActiveSessionStopping(): boolean {
    return !!this.activeSession && this.processingConnectorIds.has(this.activeSession.connector_id);
  }

  stopActiveSession(): void {
    if (!this.activeSession || this.isStoppingActiveSession || this.isActiveSessionStopping()) return;
    const { charger_id, connector_id } = this.activeSession;

    this.isStoppingActiveSession = true;
    this.processingConnectorIds.add(connector_id);
    this.chargerService.stopCharging(charger_id, connector_id).subscribe({
      next: () => {
        this.toast.success('Charging session stopped successfully.');
        this.activeSession = null;
        this.liveDurationSeconds = 0;
        this.liveEnergyUsed = 0;
        this.liveAmount = 0;
        this.stopDurationTimer();
        this.processingConnectorIds.delete(connector_id);
        this.isStoppingActiveSession = false;
      },
      error: (err) => {
        this.processingConnectorIds.delete(connector_id);
        this.isStoppingActiveSession = false;
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
      case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '0m 0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${remainingSeconds}s`;
    return `${minutes}m ${remainingSeconds}s`;
  }
}

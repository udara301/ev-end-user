import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface ChargerSession {
  vehicleName: string;
  batteryLevel: number;
  estimatedRange: number;
  isCharging: boolean;
  chargingRate?: string;
  connectorType?: string;
  stationName?: string;
  timeRemaining?: string;
}

@Component({
  selector: 'app-charger-controls-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './charger-controls-tab.component.html'
})
export class ChargerControlsTabComponent implements OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  session: ChargerSession | null = null;
  isLoading = false;

  // QR Scanner
  isScanning = false;
  scanError = '';
  manualChargerId = '';
  private stream: MediaStream | null = null;
  private scanInterval: any = null;

  // Quick actions
  readonly nearbyLink = '/charging-network';

  ngOnDestroy(): void {
    this.stopScanner();
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
    if (id) {
      this.onChargerIdentified(id);
    }
  }

  private onChargerIdentified(chargerId: string): void {
    this.manualChargerId = '';
    // TODO: Call API with chargerId to fetch charger details / start session
    console.log('Charger identified:', chargerId);
  }

  startCharging(): void {
    // TODO: integrate with charger control API
  }

  stopCharging(): void {
    // TODO: integrate with charger control API
  }
}

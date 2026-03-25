import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { PublicChargersService } from '../../services/public-chargers.service';
import { environment } from '../../../environments/environment';

interface PublicCharger {
  id: number;
  submitted_by: number;
  place_name: string;
  description: string;
  latitude: string;
  longitude: string;
  connector_type: string;
  is_verified: number;
  image_url: string | null;
  created_at: string;
  submitted_by_name: string;
}

@Component({
  selector: 'app-charging-network',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './charging-network.component.html',
  styleUrl: './charging-network.component.scss'
})
export class ChargingNetworkComponent implements OnInit {
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;

  chargers: PublicCharger[] = [];
  isLoading = true;
  mapReady = false;
  selectedCharger: PublicCharger | null = null;

  mapCenter = { lat: 7.8731, lng: 80.7718 };
  mapZoom = 8;
  mapOptions: google.maps.MapOptions = {};
  markerOptions: google.maps.MarkerOptions = {};

  constructor(private publicChargersService: PublicChargersService) {}

  ngOnInit(): void {
    this.loadGoogleMapsScript().then(() => {
      this.mapOptions = {
        mapTypeId: 'roadmap',
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] }
        ]
      };
      this.markerOptions = {
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="%230ea5e9" stroke="white" stroke-width="3"/><text x="20" y="26" text-anchor="middle" fill="white" font-family="Material Icons" font-size="20">&#xe56c;</text></svg>'
          ),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 40)
        }
      };
      this.mapReady = true;
      this.loadChargers();
    });
  }

  private loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof google !== 'undefined' && google.maps) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  private loadChargers(): void {
    this.publicChargersService.getPublicChargers().subscribe({
      next: (data: PublicCharger[]) => {
        this.chargers = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getPosition(charger: PublicCharger): google.maps.LatLngLiteral {
    return {
      lat: parseFloat(charger.latitude),
      lng: parseFloat(charger.longitude)
    };
  }

  openInfoWindow(marker: MapMarker, charger: PublicCharger): void {
    this.selectedCharger = charger;
    this.infoWindow.open(marker);
  }

  selectCharger(charger: PublicCharger): void {
    this.selectedCharger = charger;
    const lat = parseFloat(charger.latitude);
    const lng = parseFloat(charger.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      this.mapCenter = { lat, lng };
      this.mapZoom = 14;
    }
  }
}

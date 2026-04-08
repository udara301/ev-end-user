import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { PublicChargersService } from '../../services/public-chargers.service';
import { environment } from '../../../environments/environment';

interface Connector {
  id: number;
  charger_id: number;
  connector_type: string;
  charger_capacity: string;
}

interface PublicCharger {
  id: number;
  submitted_by: number;
  place_name: string;
  description: string;
  latitude: string;
  longitude: string;
  charger_network: string;
  is_verified: number;
  image_url: string | null;
  created_at: string;
  submitted_by_name: string;
  connectors: Connector[];
}

@Component({
  selector: 'app-charging-network',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsModule],
  templateUrl: './charging-network.component.html',
  styleUrl: './charging-network.component.scss'
})
export class ChargingNetworkComponent implements OnInit {
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;

  chargers: PublicCharger[] = [];
  filteredChargers: PublicCharger[] = [];
  isLoading = true;
  mapReady = false;
  selectedCharger: PublicCharger | null = null;

  // Filters
  searchQuery = '';
  selectedNetwork = '';
  selectedConnectorType = '';
  selectedVerification = '';

  // Unique filter options derived from data
  availableNetworks: string[] = [];
  availableConnectorTypes: string[] = [];

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
      // const script = document.createElement('script');
      // script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}`;
      // script.async = true;
      // script.defer = true;
      // script.onload = () => resolve();
      // document.head.appendChild(script);
    });
  }

  private loadChargers(): void {
    this.publicChargersService.getPublicChargers().subscribe({
      next: (data: PublicCharger[]) => {
        this.chargers = data;
        this.buildFilterOptions();
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private buildFilterOptions(): void {
    const networks = new Set<string>();
    const connectorTypes = new Set<string>();
    for (const charger of this.chargers) {
      if (charger.charger_network) networks.add(charger.charger_network);
      for (const c of charger.connectors) {
        connectorTypes.add(c.connector_type);
      }
    }
    this.availableNetworks = [...networks].sort();
    this.availableConnectorTypes = [...connectorTypes].sort();
  }

  applyFilters(): void {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredChargers = this.chargers.filter(charger => {
      if (query && !charger.place_name.toLowerCase().includes(query)) return false;
      if (this.selectedNetwork && charger.charger_network !== this.selectedNetwork) return false;
      if (this.selectedConnectorType && !charger.connectors.some(c => c.connector_type === this.selectedConnectorType)) return false;
      if (this.selectedVerification === 'verified' && !charger.is_verified) return false;
      if (this.selectedVerification === 'unverified' && charger.is_verified) return false;
      return true;
    });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedNetwork = '';
    this.selectedConnectorType = '';
    this.selectedVerification = '';
    this.applyFilters();
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

  openDirections(charger: PublicCharger): void {
    const lat = charger.latitude;
    const lng = charger.longitude;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  }
}

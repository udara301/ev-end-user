
import { Component, OnInit, NgZone, ViewChild, ElementRef, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-plan-journey',
    templateUrl: './plan-journey.component.html',
    styleUrls: ['./plan-journey.component.scss'],
    standalone: true,
    imports: [CommonModule],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PlanJourneyComponent implements OnInit, AfterViewInit {
    @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

    map: google.maps.Map | undefined;
    routeRenderer: any;
    startAutocompleteEl: any;
    endAutocompleteEl: any;
    startPlace: google.maps.LatLngLiteral | undefined;
    endPlace: google.maps.LatLngLiteral | undefined;
    distanceText: string = '';
    private startInputSubject = new Subject<string>();
    private endInputSubject = new Subject<string>();
    private startInputValue = '';
    private endInputValue = '';

    selectedChargingPoints = [
        { id: 1, name: 'Charging Point A' },
        { id: 2, name: 'Charging Point B' },
        { id: 3, name: 'Charging Point C' },
    ];

    constructor(private ngZone: NgZone) { }

    ngOnInit(): void {
        // Google Maps API is loaded via index.html or angular.json
        // this.loadGoogleMapsScript().then(() => {


        // });
    }

    private loadGoogleMapsScript(): Promise<void> {
        return new Promise((resolve) => {
            if (typeof google !== 'undefined' && google.maps) {
                resolve();
                return;
            }
            const script = document.createElement('script');
                  script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places&v=weekly`;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            document.head.appendChild(script);
        });
    }

    ngAfterViewInit(): void {
        this.loadGoogleMapsScript().then(() => {
            this.initMap();
            this.initDebouncedAutocomplete();
        });
    }

    initMap() {
        this.map = new google.maps.Map(this.mapContainer.nativeElement, {
            center: { lat: 7.8731, lng: 80.7718 }, // Sri Lanka center
            zoom: 7,
        });
        // Route renderer for new API
        if ((window as any).google?.maps?.routes?.Renderer) {
            this.routeRenderer = new (window as any).google.maps.routes.Renderer({
                map: this.map
            });
        }
    }

    initDebouncedAutocomplete() {
        const startInput = document.getElementById('startInput') as HTMLInputElement;
        const endInput = document.getElementById('endInput') as HTMLInputElement;

        if (startInput) {
            startInput.addEventListener('input', (e: any) => {
                this.startInputValue = e.target.value;
                this.startInputSubject.next(this.startInputValue);
            });
        }
        if (endInput) {
            endInput.addEventListener('input', (e: any) => {
                this.endInputValue = e.target.value;
                this.endInputSubject.next(this.endInputValue);
            });
        }

        // Debounce for start input
        this.startInputSubject.pipe(debounceTime(400)).subscribe(() => {
            if (startInput && (window as any).google?.maps?.places?.Autocomplete) {
                const startAutocomplete = new google.maps.places.Autocomplete(startInput, {
                    fields: ['geometry', 'name'],
                    types: ['geocode']
                });
                startAutocomplete.addListener('place_changed', () => {
                    this.ngZone.run(() => {
                        const place = startAutocomplete.getPlace();
                        if (place.geometry && place.geometry.location) {
                            this.startPlace = {
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng()
                            };
                            this.tryRenderRoute();
                        }
                    });
                });
            }
        });

        // Debounce for end input
        this.endInputSubject.pipe(debounceTime(400)).subscribe(() => {
            if (endInput && (window as any).google?.maps?.places?.Autocomplete) {
                const endAutocomplete = new google.maps.places.Autocomplete(endInput, {
                    fields: ['geometry', 'name'],
                    types: ['geocode']
                });
                endAutocomplete.addListener('place_changed', () => {
                    this.ngZone.run(() => {
                        const place = endAutocomplete.getPlace();
                        if (place.geometry && place.geometry.location) {
                            this.endPlace = {
                                lat: place.geometry.location.lat(),
                                lng: place.geometry.location.lng()
                            };
                            this.tryRenderRoute();
                        }
                    });
                });
            }
        });
    }

    async tryRenderRoute() {
        if (this.startPlace && this.endPlace) {
            // Render route if renderer and new API available
            if ((window as any).google?.maps?.routes?.Route?.computeRoutes && this.routeRenderer) {
                const request = {
                    origin: this.startPlace,
                    destination: this.endPlace,
                    travelMode: 'DRIVE',
                    routingPreference: 'TRAFFIC_AWARE',
                    computeAlternativeRoutes: false,
                    languageCode: 'en',
                    units: 'METRIC',
                };
                try {
                    const response = await (window as any).google.maps.routes.Route.computeRoutes(request);
                    if (response && response.routes && response.routes.length > 0) {
                        this.routeRenderer.render({ routes: response.routes });
                    }
                } catch (e) {
                    // handle error
                    console.error('Route computation failed', e);
                }
            }
            // Calculate distance using DirectionsService
            if ((window as any).google?.maps?.DirectionsService) {
                const directionsService = new google.maps.DirectionsService();
                directionsService.route(
                    {
                        origin: this.startPlace,
                        destination: this.endPlace,
                        travelMode: google.maps.TravelMode.DRIVING
                    },
                    (result, status) => {
                        this.ngZone.run(() => {
                            if (status === 'OK' && result && result.routes && result.routes.length > 0) {
                                const leg = result.routes[0].legs[0];
                                this.distanceText = leg.distance?.text || '';
                            } else {
                                this.distanceText = '';
                            }
                        });
                    }
                );
            }
        }
    }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LocationService } from '../../services/location.service';
import { LocalStorageService } from '../../services/localStorage.service';
import { ToastService } from '../../services/toast.service';
import flatpickr from 'flatpickr';
import { AfterViewInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';


type VehicleCategory = 'car' | 'tuktuk' | 'bike' | 'scooter';

interface SearchVehicle {
  vehicle_id: number;
  model_id: number;
  category: VehicleCategory;
  model_name: string;
  brand: string;
  image_url: string;
  base_price_per_day: number;
  range_per_charge: number;
  passenger_count: number;
  battery_capacity: number;
  dc_connector_type: string
  ac_connector_type: string
  motor_power: number;
}


@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})

// newly

export class SearchComponent implements AfterViewInit {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  sortBy = 'recommended';
  selectedCategory: 'all' | VehicleCategory = 'all';
  selectedPriceBand: 'all' | 'budget' | 'mid' | 'premium' = 'all';
  selectedTransmission: 'all' | 'Auto' | 'Manual' = 'all';
  onlyFastCharge = false;

  // Newly added
  locations: any[] = [];
  selectedPickupLocation: string = '';
  selectedDropoffLocation: string = '';
  selectedPickupDate: string = '';
  selectedDropoffDate: string = '';
  vehicles: SearchVehicle[] = [];

  constructor(private locationService: LocationService, private bookingService: BookingService, private toast: ToastService) { }

  ngOnInit(): void {
    this.locationService.getLocations().subscribe((locations: any) => {
      this.locations = locations;
    });

    // Load search criteria from localStorage
    this.loadSearchCriteria();
  }

  private pickupFp: any;
  private returnFp: any;

  ngAfterViewInit(): void {
    this.pickupFp = flatpickr('#pickupDate', {
      minDate: "today",
      dateFormat: "Y-m-d",
      onChange: (selectedDates: Date[]) => {
        if (selectedDates.length > 0) {
          const nextDay = new Date(selectedDates[0]);
          nextDay.setDate(nextDay.getDate() + 1);
          this.returnFp.set('minDate', nextDay);
          if (this.selectedDropoffDate && new Date(this.selectedDropoffDate) <= selectedDates[0]) {
            this.selectedDropoffDate = '';
            this.returnFp.clear();
          }
        }
      }
    });

    this.returnFp = flatpickr('#returnDate', {
      minDate: "today",
      dateFormat: "Y-m-d"
    });
  }

  private loadSearchCriteria(): void {
    const criteria = this.localStorageService.getSearchCriteria();
    if (criteria) {
      this.selectedPickupLocation = criteria.pickupLocation;
      this.selectedDropoffLocation = criteria.dropoffLocation;
      this.selectedPickupDate = criteria.pickupDate;
      this.selectedDropoffDate = criteria.dropoffDate;
      this.selectedCategory = criteria.category as any;
      console.log('Search criteria loaded from localStorage:', criteria);
      if (this.selectedPickupLocation && this.selectedDropoffLocation && this.selectedPickupDate && this.selectedDropoffDate) {
        this.searchVehicles();
      }
    }
  }

  searchVehicles(): void {
    if (!this.selectedPickupLocation || !this.selectedDropoffLocation || !this.selectedPickupDate || !this.selectedDropoffDate) {
      this.toast.warning('Please fill in all search fields.');
      return;
    }

    this.localStorageService.saveSearchCriteria({
      pickupLocation: this.selectedPickupLocation,
      dropoffLocation: this.selectedDropoffLocation,
      pickupDate: this.selectedPickupDate,
      dropoffDate: this.selectedDropoffDate,
      category: this.selectedCategory
    });


    this.bookingService.searchAvailableVehicles(this.selectedCategory, this.selectedPickupDate, this.selectedDropoffDate)
      .subscribe((vehicles: any[]) => {
        // Handle the search results here
        console.log(vehicles);
        this.vehicles = vehicles;
        this.filteredVehicles; // Trigger getter to apply filters/sorting
      });
  }


  get filteredVehicles(): SearchVehicle[] {
    const filtered = this.vehicles.filter((vehicle) => {
      const categoryMatch = this.selectedCategory === 'all' || vehicle.category === this.selectedCategory;
      // const transmissionMatch = this.selectedTransmission === 'all' || vehicle.transmission === this.selectedTransmission;
      // const fastChargeMatch = !this.onlyFastCharge || vehicle.fastCharge;
      const priceBandMatch =
        this.selectedPriceBand === 'all' ||
        (this.selectedPriceBand === 'budget' && vehicle.base_price_per_day < 80) ||
        (this.selectedPriceBand === 'mid' && vehicle.base_price_per_day >= 80 && vehicle.base_price_per_day < 150) ||
        (this.selectedPriceBand === 'premium' && vehicle.base_price_per_day >= 150);

      // return categoryMatch && transmissionMatch && fastChargeMatch && priceBandMatch;
      return categoryMatch && priceBandMatch;
    });

    if (this.sortBy === 'priceLowHigh') {
      return [...filtered].sort((a, b) => a.base_price_per_day - b.base_price_per_day);
    }

    if (this.sortBy === 'rangeHighLow') {
      return [...filtered].sort((a, b) => b.range_per_charge - a.range_per_charge);
    }

    return filtered;
  }

  setCategory(category: 'all' | VehicleCategory): void {
    this.selectedCategory = category;
  }

  clearFilters(): void {
    this.selectedCategory = 'all';
    this.selectedPriceBand = 'all';
    this.selectedTransmission = 'all';
    this.onlyFastCharge = false;
    this.sortBy = 'recommended';
  }

  categoryIcon(category: VehicleCategory): string {
    if (category === 'car') {
      return 'directions_car';
    }
    if (category === 'tuktuk') {
      return 'electric_rickshaw';
    }
    if (category === 'bike') {
      return 'electric_bike';
    }
    return 'electric_scooter';
  }

  clearSearch(): void {
    this.selectedPickupLocation = '';
    this.selectedDropoffLocation = '';
    this.selectedPickupDate = '';
    this.selectedDropoffDate = '';
    this.selectedCategory = 'all';
    this.vehicles = [];

    this.clearFilters();
    this.localStorageService.clearSearchCriteria();

    const pickupDateInput = document.getElementById('pickupDate') as HTMLInputElement | null;
    const returnDateInput = document.getElementById('returnDate') as HTMLInputElement | null;

    if (pickupDateInput) {
      pickupDateInput.value = '';
    }

    if (returnDateInput) {
      returnDateInput.value = '';
    }
  }

  reserveVehicle(vehicle: SearchVehicle): void {
    const modelId = vehicle.vehicle_id; // Assuming vehicle_id is the unique identifier for the vehicle model

    this.localStorageService.saveSelectedVehicle({ modelId });

    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/booking-summary']);
      return;
    }

    this.router.navigate(['/login'], { queryParams: { returnUrl: '/booking-summary' } });
  }

}

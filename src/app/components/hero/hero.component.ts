import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LocationService } from '../../services/location.service';
import { LocalStorageService } from '../../services/localStorage.service';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';
import flatpickr from 'flatpickr';
import { AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent implements AfterViewInit{
  private readonly router = inject(Router);
  private readonly localStorageService = inject(LocalStorageService);

  locations: any[] = [];
  selectedPickupLocation: string = '';
  selectedDropoffLocation: string = '';
  selectedPickupDate: string = '';
  selectedDropoffDate: string = '';
  selectedCategory: string = 'all';

  constructor(private locationService: LocationService, private toast: ToastService) { }

  private pickupFp: any;
  private dropoffFp: any;

  ngAfterViewInit(): void {
    this.pickupFp = flatpickr('#pickupDate', {
      minDate: "today",
      dateFormat: "Y-m-d",
      onChange: (selectedDates: Date[]) => {
        if (selectedDates.length > 0) {
          const nextDay = new Date(selectedDates[0]);
          nextDay.setDate(nextDay.getDate() + 1);
          this.dropoffFp.set('minDate', nextDay);
          if (this.selectedDropoffDate && new Date(this.selectedDropoffDate) <= selectedDates[0]) {
            this.selectedDropoffDate = '';
            this.dropoffFp.clear();
          }
        }
      }
    });

    this.dropoffFp = flatpickr('#dropoffDate', {
      minDate: "today",
      dateFormat: "Y-m-d"
    });
  }

  ngOnInit() {
    this.locationService.getLocations().subscribe((data: any) => {
      this.locations = data;
      console.log('Locations:', this.locations);
    });
  }

  findEV(): void {
    
    if (!this.selectedPickupLocation || !this.selectedDropoffLocation || !this.selectedPickupDate || !this.selectedDropoffDate) {
      this.toast.warning('Please fill in all search fields.');
      return;
    }

    // Save search criteria to localStorage
    this.localStorageService.saveSearchCriteria({
      pickupLocation: this.selectedPickupLocation,
      dropoffLocation: this.selectedDropoffLocation,
      pickupDate: this.selectedPickupDate,
      dropoffDate: this.selectedDropoffDate,
      category: this.selectedCategory
    });

    // Navigate to search page
    this.router.navigate(['/search']);
  }
}

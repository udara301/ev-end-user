import { Component } from '@angular/core';
import { LocationService } from '../../services/location.service';
import { CommonModule } from '@angular/common';
import flatpickr from 'flatpickr';
import { AfterViewInit } from '@angular/core';


@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent implements AfterViewInit{
  locations: any[] = [];
  selectedPickupLocation: string = '';
  selectedReturnLocation: string = '';
  constructor(private locationService: LocationService) { }

   ngAfterViewInit(): void {
    flatpickr('#pickupDate', {
      minDate: "today",
      dateFormat: "Y-m-d"
    });

    flatpickr('#returnDate', {
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
}

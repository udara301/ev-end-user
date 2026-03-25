import { Component, OnInit } from '@angular/core';
import { VehicleService } from '../../services/vehicle.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss'
})
export class VehiclesComponent {
  vehicles:Record<string, any[]> = {};
  selectedCategory: string = 'car';
  selectedVehicles: any = null;

  constructor(private vehicleService: VehicleService) { }

  ngOnInit() {
    this.vehicleService.getAllVehiclesByCategory().subscribe((data: any) => {
      this.vehicles = data;
      if (this.vehicles) {
        this.selectedVehicles = this.vehicles[this.selectedCategory] || [];
        console.log('Vehicles:', this.selectedVehicles);
      }
    });
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    if (this.vehicles) {
      this.selectedVehicles = this.vehicles[this.selectedCategory] || [];
      console.log('Filtered Vehicles:', this.selectedVehicles);
    }
    console.log('Selected Category:', this.selectedCategory);
  }
}

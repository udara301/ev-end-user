import { Injectable } from '@angular/core';

export interface SearchCriteria {
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  dropoffDate: string;
  category: string;
}

export interface SelectedVehicleReference {
  modelId: number;
}

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private readonly searchCriteriaKey = 'ev_search_criteria';
  private readonly selectedVehicleKey = 'ev_selected_vehicle';

  /**
   * Save search criteria to localStorage
   */
  saveSearchCriteria(criteria: SearchCriteria): void {
    try {
      localStorage.setItem(this.searchCriteriaKey, JSON.stringify(criteria));
    } catch (error) {
      console.error('Error saving search criteria to localStorage:', error);
    }
  }

  /**
   * Retrieve search criteria from localStorage
   */
  getSearchCriteria(): SearchCriteria | null {
    try {
      const data = localStorage.getItem(this.searchCriteriaKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving search criteria from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear search criteria from localStorage
   */
  clearSearchCriteria(): void {
    try {
      localStorage.removeItem(this.searchCriteriaKey);
    } catch (error) {
      console.error('Error clearing search criteria from localStorage:', error);
    }
  }

  saveSelectedVehicle(reference: SelectedVehicleReference): void {
    try {
      localStorage.setItem(this.selectedVehicleKey, JSON.stringify(reference));
    } catch (error) {
      console.error('Error saving selected vehicle to localStorage:', error);
    }
  }

  getSelectedVehicle(): SelectedVehicleReference | null {
    try {
      const data = localStorage.getItem(this.selectedVehicleKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving selected vehicle from localStorage:', error);
      return null;
    }
  }

  clearSelectedVehicle(): void {
    try {
      localStorage.removeItem(this.selectedVehicleKey);
    } catch (error) {
      console.error('Error clearing selected vehicle from localStorage:', error);
    }
  }
}
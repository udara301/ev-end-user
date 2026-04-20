import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LocationService } from '../../services/location.service';
import { LocalStorageService } from '../../services/localStorage.service';
import { VehicleService } from '../../services/vehicle.service';
import { BookingService } from '../../services/booking.service';
import { ToastService } from '../../services/toast.service';
import { PaymentService } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface BookingSummaryData {
  vehicle: {
    vehicle_id?: number;
    model_id?: number;
    plate_number: string;
    current_status: string;
    model_name: string;
    brand: string;
    category: string;
    base_price_per_day: number;
    passenger_count: number;
    image_url: string;
    range_per_charge: number;
    deposit: number;
    top_speed: number | null;
    battery_capacity: string;
    charging_time: string;
    motor_power: string;
    ac_connector_type: string;
    dc_connector_type: string;
  };
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  dropoffDate: string;
  rentalDays: number;
}

@Component({
  selector: 'app-booking-summary',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './booking-summary.component.html',
  styleUrl: './booking-summary.component.scss'
})
export class BookingSummaryComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly vehicleService = inject(VehicleService);
  private readonly locationService = inject(LocationService);
  private readonly bookingService = inject(BookingService);
  private readonly paymentService = inject(PaymentService);
  private readonly authService = inject(AuthService);
  private readonly ngZone = inject(NgZone);
  private readonly toast = inject(ToastService);

  bookingData: BookingSummaryData = null as any;
  paymentError = '';

  acceptTerms = false;
  isLoading = true;
  loadError = '';
  isSubmitting = false;
  pickupLocationPrice = 0;
  dropoffLocationPrice = 0;
  pickupTime = '';
  dropoffTime = '';

  timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour24 = i.toString().padStart(2, '0') + ':00';
    const period = i < 12 ? 'AM' : 'PM';
    const hour12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
    return { value: hour24, label: `${hour12}:00 ${period}` };
  });

  ngOnInit(): void {
    this.loadSummaryData();
  }

  get subtotal(): number {
    return this.bookingData.vehicle.base_price_per_day * this.bookingData.rentalDays;
  }

  get pickupReturnCost(): number {
    return this.pickupLocationPrice + this.dropoffLocationPrice;
  }

  get totalCost(): number {
    return this.subtotal + this.pickupReturnCost;
  }

  goBack(): void {
    this.router.navigate(['/search']);
  }

  confirmBooking(): void {
    if (!this.acceptTerms) {
      this.toast.warning('Please accept the terms and conditions to proceed.');
      return;
    }
    if (!this.pickupTime || !this.dropoffTime) {
      this.toast.warning('Please select both pickup and dropoff times.');
      return;
    }

    this.isSubmitting = true;
    this.paymentError = '';

    this.bookingService.placeBooking(
      this.bookingData.vehicle.vehicle_id!,
      this.bookingData.pickupDate,
      this.pickupTime,
      this.bookingData.dropoffDate,
      this.dropoffTime,
      this.totalCost
    ).subscribe({
      next: (res: any) => {
        const orderId = res?.bookingId ?? res?.order_id ?? res?.id;
        if (!orderId) {
          this.isSubmitting = false;
          this.paymentError = 'Booking created but no order ID returned. Please contact support.';
          return;
        }
        this.initiatePayment(String(orderId));
      },
      error: (err) => {
        this.isSubmitting = false;
        this.paymentError = err?.error?.message || 'Failed to place booking. Please try again.';
      }
    });
  }

  private initiatePayment(orderId: string): void {
    const amount = this.totalCost;
    const currency = 'LKR';

    this.paymentService.initiatePayment({
      booking_id: orderId,
      amount,
      method: 'payhere',
    }).subscribe({
      next: () => {
        this.processPayhere(orderId, amount, currency);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.paymentError = err?.error?.message || 'Failed to initiate payment. Please try again.';
      }
    });
  }

  private processPayhere(orderId: string, amount: number, currency: string): void {
    this.paymentService.getPaymentHash({ order_id: orderId, amount, currency }).subscribe({
      next: (hashRes) => {
        const user = this.authService.getUserFromToken();
        const fullName = (user?.name || 'Customer').split(' ');
        const firstName = fullName[0] || 'Customer';
        const lastName = fullName.slice(1).join(' ') || '-';
        const amountFormatted = Number(amount).toFixed(2);
        // Temp usage 
        const payment = {
            "sandbox": true,
            "merchant_id": environment.payhereMerchantId,
            "return_url": "https://travelwithev.com/booking-success", // පේමන්ට් එක සාර්ථක වුණාම backend එකට මැසේජ් එක එන්නේ මෙතනට
            "cancel_url": "https://travelwithev.com/booking-cancel",
            "notify_url": "https://travelwithev.com/api/v1/payments/notify", // පේමන්ට් එක වුණාම backend එකට මැසේජ් එක එන්නේ මෙතනට
            "order_id": orderId.toString(),
            "items": `${this.bookingData.vehicle.brand} ${this.bookingData.vehicle.model_name} Rental`,
            "amount": amountFormatted,
            "currency": currency,
            "hash": hashRes.hash, // අර අපි හදපු hash එක
            "first_name": "Saman",
            "last_name": "Perera",
            "email": "samanp@gmail.com",
            "phone": "0771234567",
            "address": "No.1, Galle Road",
            "city": "Colombo",
            "country": "Sri Lanka",
        };


        this.paymentService.startPayment(
         payment,
          {
            onCompleted: (completedOrderId: string) => {
              this.ngZone.run(() => {
                this.isSubmitting = false;
                const successState = {
                  orderId: orderId,
                  vehicleName: `${this.bookingData.vehicle.brand} ${this.bookingData.vehicle.model_name}`,
                  pickupLocation: this.bookingData.pickupLocation,
                  dropoffLocation: this.bookingData.dropoffLocation,
                  pickupDate: this.bookingData.pickupDate,
                  dropoffDate: this.bookingData.dropoffDate,
                  totalCost: this.totalCost,
                };
                this.localStorageService.clearSearchCriteria();
                this.localStorageService.clearSelectedVehicle();
                this.router.navigate(['/booking-success'], { state: successState });
              });
            },
            onDismissed: () => {
              this.ngZone.run(() => {
                this.isSubmitting = false;
                this.router.navigate(['/booking-cancel'], {
                  state: {
                    orderId: orderId,
                    errorMessage: 'Payment was cancelled. Your booking is pending — you can retry payment.',
                  }
                });
              });
            },
            onError: (error: string) => {
              this.ngZone.run(() => {
                this.isSubmitting = false;
                this.router.navigate(['/booking-cancel'], {
                  state: {
                    orderId: orderId,
                    errorMessage: 'Payment failed: ' + error,
                  }
                });
              });
            },
          }
        );
      },
      error: (err) => {
        this.isSubmitting = false;
        this.paymentError = err?.error?.message || 'Failed to process payment. Please try again.';
      }
    });
  }

  private loadSummaryData(): void {
    const searchCriteria = this.localStorageService.getSearchCriteria();
    const selectedVehicle = this.localStorageService.getSelectedVehicle();

    if (!searchCriteria || !selectedVehicle) {
      this.loadError = 'Booking details are missing. Please select a vehicle again.';
      this.isLoading = false;
      return;
    }

    this.bookingData = {
      ...this.bookingData,
      pickupLocation: searchCriteria.pickupLocation,
      dropoffLocation: searchCriteria.dropoffLocation,
      pickupDate: searchCriteria.pickupDate,
      dropoffDate: searchCriteria.dropoffDate,
      rentalDays: this.calculateRentalDays(searchCriteria.pickupDate, searchCriteria.dropoffDate)
    };

    this.locationService.getLocations().subscribe({
      next: (locations: any) => {
        const locationList = Array.isArray(locations) ? locations : [];
        this.bookingData.pickupLocation = this.resolveLocationName(locationList, searchCriteria.pickupLocation);
        this.bookingData.dropoffLocation = this.resolveLocationName(locationList, searchCriteria.dropoffLocation);
        this.pickupLocationPrice = this.resolveLocationPrice(locationList, searchCriteria.pickupLocation);
        this.dropoffLocationPrice = this.resolveLocationPrice(locationList, searchCriteria.dropoffLocation);
      },
      error: () => {
        this.bookingData.pickupLocation = searchCriteria.pickupLocation;
        this.bookingData.dropoffLocation = searchCriteria.dropoffLocation;
      }
    });

    this.vehicleService.getVehicleById(selectedVehicle.modelId).subscribe({
      next: (vehicle: any) => {
        
        this.bookingData.vehicle = {
          vehicle_id: vehicle?.vehicle_id,
          model_id: vehicle?.model_id,
          plate_number: vehicle?.plate_number ?? '',
          current_status: vehicle?.current_status ?? '',
          model_name: vehicle?.model_name ?? '',
          brand: vehicle?.brand ?? '',
          category: vehicle?.category ?? '',
          base_price_per_day: Number(vehicle?.base_price_per_day ?? 0),
          passenger_count: Number(vehicle?.passenger_count ?? 0),
          image_url: vehicle?.image_url ?? '',
          range_per_charge: Number(vehicle?.range_per_charge ?? 0),
          deposit: Number(vehicle?.deposit ?? 0),
          top_speed: vehicle?.top_speed ? Number(vehicle.top_speed) : null,
          battery_capacity: vehicle?.battery_capacity ?? '',
          charging_time: vehicle?.charging_time ?? '',
          motor_power: vehicle?.motor_power ?? '',
          ac_connector_type: vehicle?.ac_connector_type ?? '',
          dc_connector_type: vehicle?.dc_connector_type ?? ''
        };
        console.log('Vehicle details loaded:', this.bookingData.vehicle);
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Unable to load the selected vehicle. Please return to search and try again.';
        this.isLoading = false;
      }
    });
  }

  private calculateRentalDays(pickupDate: string, dropoffDate: string): number {
    const pickup = new Date(pickupDate);
    const dropoff = new Date(dropoffDate);
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const difference = Math.ceil((dropoff.getTime() - pickup.getTime()) / millisecondsPerDay);

    return difference > 0 ? difference : 1;
  }

  private resolveLocationName(locations: any[], locationId: string): string {
    const match = locations.find((location) => String(location.location_id) === String(locationId));
    return match?.location_name ?? locationId;
  }

  private resolveLocationPrice(locations: any[], locationId: string): number {
    const match = locations.find((location) => String(location.location_id) === String(locationId));
    return Number(match?.price ?? 0);
  }
}

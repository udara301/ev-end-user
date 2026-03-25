import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
  icon: string;
  accent: string;
}

interface BookingCard {
  id: string;
  vehicle: string;
  period: string;
  pickup: string;
  status: 'Upcoming' | 'Active' | 'Completed';
  chargeLevel: number;
  amount: string;
}

interface ActivityItem {
  title: string;
  time: string;
  detail: string;
  icon: string;
}

interface PaymentItem {
  title: string;
  dueDate: string;
  amount: string;
  state: 'Paid' | 'Due Soon' | 'Auto Pay';
}

interface PreferenceItem {
  title: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  readonly customerName = 'Nimali Perera';

  readonly membershipTier = 'Gold Traveler';

  readonly metrics: DashboardMetric[] = [
    {
      label: 'Active Booking',
      value: '01',
      detail: 'Tesla Model 3 until 28 Mar',
      icon: 'directions_car',
      accent: 'from-sky-500/20 to-cyan-400/20'
    },
    {
      label: 'Total Savings',
      value: 'Rs 18,400',
      detail: 'Compared with fuel trips this quarter',
      icon: 'savings',
      accent: 'from-emerald-500/20 to-lime-400/20'
    },
    {
      label: 'Charge Credits',
      value: '126 kWh',
      detail: '18 kWh expiring in 6 days',
      icon: 'bolt',
      accent: 'from-amber-400/20 to-orange-500/20'
    },
    {
      label: 'Support Score',
      value: '4.9/5',
      detail: 'Based on your last 8 rentals',
      icon: 'star',
      accent: 'from-fuchsia-500/20 to-pink-400/20'
    }
  ];

  readonly bookings: BookingCard[] = [
    {
      id: 'BK-2048',
      vehicle: 'Tesla Model 3',
      period: '24 Mar - 28 Mar',
      pickup: 'Colombo City Hub',
      status: 'Active',
      chargeLevel: 82,
      amount: 'Rs 54,000'
    },
    {
      id: 'BK-1984',
      vehicle: 'BYD Dolphin',
      period: '04 Apr - 06 Apr',
      pickup: 'Negombo Airport Desk',
      status: 'Upcoming',
      chargeLevel: 100,
      amount: 'Rs 26,500'
    },
    {
      id: 'BK-1762',
      vehicle: 'Nissan Leaf',
      period: '12 Mar - 15 Mar',
      pickup: 'Kandy Lake Point',
      status: 'Completed',
      chargeLevel: 64,
      amount: 'Rs 31,200'
    }
  ];

  readonly activity: ActivityItem[] = [
    {
      title: 'Vehicle unlocked remotely',
      time: 'Today, 08:42 AM',
      detail: 'Tesla Model 3 was opened from your mobile app.',
      icon: 'lock_open'
    },
    {
      title: 'Charging session completed',
      time: 'Today, 07:55 AM',
      detail: 'Added 32 kWh at Marine Drive fast charger.',
      icon: 'ev_station'
    },
    {
      title: 'Trip reminder sent',
      time: 'Yesterday, 06:10 PM',
      detail: 'Airport pickup instructions were emailed to you.',
      icon: 'notifications'
    }
  ];

  readonly payments: PaymentItem[] = [
    {
      title: 'Current rental balance',
      dueDate: 'Due 29 Mar 2026',
      amount: 'Rs 12,800',
      state: 'Due Soon'
    },
    {
      title: 'Membership renewal',
      dueDate: 'Renews 12 Apr 2026',
      amount: 'Rs 8,500',
      state: 'Auto Pay'
    },
    {
      title: 'Security hold release',
      dueDate: 'Processed 17 Mar 2026',
      amount: 'Rs 20,000',
      state: 'Paid'
    }
  ];

  readonly preferences: PreferenceItem[] = [
    {
      title: 'Preferred pickup zone',
      value: 'Colombo 03',
      icon: 'place'
    },
    {
      title: 'Favorite vehicle type',
      value: 'Compact EV Sedan',
      icon: 'directions_car'
    },
    {
      title: 'Charging preference',
      value: 'Fast chargers only',
      icon: 'battery_charging_full'
    }
  ];

  readonly supportHighlights = [
    'Dedicated hotline response under 5 minutes',
    'Roadside support included for every live booking',
    'Digital invoices synced after each completed trip'
  ];

  statusClasses(status: BookingCard['status']): string {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-700';
      case 'Upcoming':
        return 'bg-sky-100 text-sky-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  paymentStateClasses(state: PaymentItem['state']): string {
    switch (state) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-700';
      case 'Due Soon':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-violet-100 text-violet-700';
    }
  }

}

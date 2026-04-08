import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

interface ProfileForm {
  name: string;
  phone_number: string;
  vehicle_model: string;
  vehicle_number: string;
  address: string;
  nic: string;
  passport_number: string;
  is_local: boolean;
}

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile.component.html'
})
export class EditProfileComponent implements OnInit {
  @Input() user: any = null;
  @Output() back = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<void>();

  form: ProfileForm = {
    name: '',
    phone_number: '',
    vehicle_model: '',
    vehicle_number: '',
    address: '',
    nic: '',
    passport_number: '',
    is_local: true
  };

  isSaving = false;
  successMessage = '';
  errorMessage = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    if (this.user) {
      this.form = {
        name: this.user.name || '',
        phone_number: this.user.phone_number || '',
        vehicle_model: this.user.vehicle_model || '',
        vehicle_number: this.user.vehicle_number || '',
        address: this.user.address || '',
        nic: this.user.nic || '',
        passport_number: this.user.passport_number || '',
        is_local: this.user.is_local !== undefined ? !!this.user.is_local : true
      };
    }
  }

  onSubmit(): void {
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.authService.updateCustomerProfile(this.form).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Profile updated successfully';
        this.profileUpdated.emit();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Failed to update profile. Please try again.';
      }
    });
  }

  goBack(): void {
    this.back.emit();
  }
}
